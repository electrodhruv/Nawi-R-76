/**
 * Browser WebSerial Hardware Integration Driver
 * 
 * In accordance with OIML R 76-1:2006 Clause 4.4.2 (Stability of Equilibrium).
 * Supports continuous ASCII balance streams and MT-SICS command-response protocols (S, SI, Z, T).
 */

export interface SerialReading {
  raw: string;
  weight: number;
  unit: string;
  isStable: boolean;
  timestamp: number;
  isEquilibriumLocked: boolean; // True if capture MUST be rejected
  equilibriumDelta: number;     // Delta observed in current stability window
  stabilityNote?: string;
}

export type SerialConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface WebSerialConfig {
  baudRate?: number;
  dataBits?: 7 | 8;
  stopBits?: 1 | 2;
  parity?: 'none' | 'even' | 'odd';
  bufferSize?: number;
  verificationInterval_e?: number; // e in same unit as weight (for Clause 4.4.2 lock)
  stabilityWindowMs?: number;      // e.g. 1000ms
  stabilityMaxDelta_e?: number;    // e.g. 1.0 e per Clause 4.4.2
}

export class WebSerialDriver {
  private port: any = null;
  private reader: any = null;
  private writer: any = null;
  private keepReading = false;
  private status: SerialConnectionStatus = 'DISCONNECTED';
  private config: Required<WebSerialConfig>;

  // Sliding window for Clause 4.4.2 Equilibrium Verification
  private recentSamples: Array<{ weight: number; timestamp: number }> = [];

  private readingListeners: Array<(reading: SerialReading) => void> = [];
  private statusListeners: Array<(status: SerialConnectionStatus) => void> = [];
  private simInterval: any = null;

  constructor(customConfig?: WebSerialConfig) {
    this.config = {
      baudRate: customConfig?.baudRate ?? 9600,
      dataBits: customConfig?.dataBits ?? 8,
      stopBits: customConfig?.stopBits ?? 1,
      parity: customConfig?.parity ?? 'none',
      bufferSize: customConfig?.bufferSize ?? 255,
      verificationInterval_e: customConfig?.verificationInterval_e ?? 0.001,
      stabilityWindowMs: customConfig?.stabilityWindowMs ?? 1000,
      stabilityMaxDelta_e: customConfig?.stabilityMaxDelta_e ?? 1.0,
    };
  }

  public startSimulation(targetWeight = 15.0, e = 0.001): void {
    this.stopSimulation();
    this.setStatus('CONNECTED');
    this.updateVerificationInterval(e);
    let step = 0;
    this.simInterval = setInterval(() => {
      step++;
      // Periodically simulate dynamic motion (ticks 1 & 2), then steady stable equilibrium
      const isDynamic = step % 8 === 1 || step % 8 === 2;
      const jitter = isDynamic ? (Math.random() - 0.5) * 6 * e : (Math.random() - 0.5) * 0.15 * e;
      const currentWeight = Number((targetWeight + jitter).toFixed(4));
      const raw = isDynamic ? `US,GS,+${currentWeight.toFixed(3)}kg` : `ST,GS,+${currentWeight.toFixed(3)}kg`;
      const reading = this.parseTelemetryFrame(raw);
      if (reading) {
        this.readingListeners.forEach((fn) => fn(reading));
      }
    }, 350);
  }

  public stopSimulation(): void {
    if (this.simInterval) {
      clearInterval(this.simInterval);
      this.simInterval = null;
    }
    if (this.status === 'CONNECTED' && !this.port) {
      this.setStatus('DISCONNECTED');
    }
  }

  public isSimulating(): boolean {
    return this.simInterval !== null;
  }

  public static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public updateVerificationInterval(e: number): void {
    if (e > 0) {
      this.config.verificationInterval_e = e;
    }
  }

  public subscribe(onReading: (reading: SerialReading) => void): () => void {
    this.readingListeners.push(onReading);
    return () => {
      this.readingListeners = this.readingListeners.filter((fn) => fn !== onReading);
    };
  }

  public onStatus(onStatusChange: (status: SerialConnectionStatus) => void): () => void {
    this.statusListeners.push(onStatusChange);
    return () => {
      this.statusListeners = this.statusListeners.filter((fn) => fn !== onStatusChange);
    };
  }

  private setStatus(newStatus: SerialConnectionStatus): void {
    this.status = newStatus;
    this.statusListeners.forEach((fn) => fn(newStatus));
  }

  public getStatus(): SerialConnectionStatus {
    return this.status;
  }

  /**
   * Request user permission to connect to a balance serial port
   */
  public async requestAndConnect(): Promise<boolean> {
    if (!WebSerialDriver.isSupported()) {
      throw new Error('WebSerial API is not supported in this browser. Please use Chrome, Edge, or Opera.');
    }

    try {
      this.setStatus('CONNECTING');
      const nav = navigator as any;
      this.port = await nav.serial.requestPort();
      await this.port.open({
        baudRate: this.config.baudRate,
        dataBits: this.config.dataBits,
        stopBits: this.config.stopBits,
        parity: this.config.parity,
        bufferSize: this.config.bufferSize,
      });

      this.setStatus('CONNECTED');
      this.startReadingLoop();
      return true;
    } catch (err) {
      console.error('Failed to open serial port:', err);
      this.setStatus('ERROR');
      return false;
    }
  }

  /**
   * Continuously read and parse ASCII frames from the balance
   */
  private async startReadingLoop(): Promise<void> {
    this.keepReading = true;
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    let buffer = '';

    try {
      while (this.keepReading) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          buffer += value;
          const lines = buffer.split(/[\r\n]+/);
          // Keep whatever incomplete snippet is left after last split
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.length > 0) {
              const parsed = this.parseTelemetryFrame(trimmed);
              if (parsed) {
                this.readingListeners.forEach((fn) => fn(parsed));
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn('Serial reader stream error or closure:', err);
    } finally {
      this.setStatus('DISCONNECTED');
    }
  }

  /**
   * Send MT-SICS commands to the balance (e.g., 'S', 'SI', 'Z', 'T')
   */
  public async sendCommand(command: 'S' | 'SI' | 'Z' | 'T' | string): Promise<void> {
    if (!this.port || !this.port.writable) {
      throw new Error('Serial port is not writable or not connected.');
    }

    const encoder = new TextEncoder();
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(encoder.encode(`${command}\r\n`));
    } finally {
      writer.releaseLock();
    }
  }

  /**
   * Parse continuous ASCII and MT-SICS protocol messages
   * Evaluates Equilibrium Lock per OIML R 76-1 Clause 4.4.2
   */
  public parseTelemetryFrame(raw: string): SerialReading | null {
    const now = Date.now();
    let weight: number | null = null;
    let unit = 'kg';
    let explicitStable: boolean | null = null;

    // 1. MT-SICS format: "S S   10.000 kg" (Stable) or "S D   10.000 kg" (Dynamic/Unstable)
    if (raw.startsWith('S S') || raw.startsWith('S D') || raw.startsWith('S I')) {
      if (raw.startsWith('S S')) explicitStable = true;
      if (raw.startsWith('S D')) explicitStable = false;
      if (raw.startsWith('S I')) explicitStable = false;

      const tokens = raw.replace(/^S [SDI]\s*/, '').trim().split(/\s+/);
      if (tokens.length >= 1) {
        weight = parseFloat(tokens[0]);
        if (tokens.length > 1) unit = tokens[1];
      }
    }
    // 2. Standard Continuous ASCII: "ST,GS,+0010.000kg" or "US,GS,+0009.998kg"
    else if (raw.includes('ST,') || raw.includes('US,')) {
      explicitStable = raw.includes('ST,');
      const match = raw.match(/([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
      if (match) {
        weight = parseFloat(match[1]);
        if (match[2]) unit = match[2];
      }
    }
    // 3. Fallback generic numeric line: "10.000 kg" or "10.000"
    else {
      const match = raw.match(/([+-]?\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
      if (match) {
        weight = parseFloat(match[1]);
        if (match[2]) unit = match[2];
      }
    }

    if (weight === null || isNaN(weight)) {
      return null;
    }

    // Update sliding equilibrium window for Clause 4.4.2
    this.recentSamples.push({ weight, timestamp: now });
    const cutoff = now - this.config.stabilityWindowMs;
    this.recentSamples = this.recentSamples.filter((s) => s.timestamp >= cutoff);

    // Compute sample delta across stability window
    let minW = weight;
    let maxW = weight;
    for (const s of this.recentSamples) {
      if (s.weight < minW) minW = s.weight;
      if (s.weight > maxW) maxW = s.weight;
    }
    const equilibriumDelta = Math.abs(maxW - minW);

    // Equilibrium Lock Rule (Clause 4.4.2):
    // Reading is locked (isEquilibriumLocked = true) if:
    //  a) Hardware telemetry explicitly flags dynamic/unstable (e.g. US or S D), OR
    //  b) Drift in the 1-second window exceeds 1 * e
    const maxPermittedDelta = this.config.stabilityMaxDelta_e * this.config.verificationInterval_e;
    const windowIsStable = equilibriumDelta <= maxPermittedDelta;

    const isStable = explicitStable !== null ? explicitStable && windowIsStable : windowIsStable;
    const isEquilibriumLocked = !isStable;

    let stabilityNote = 'Equilibrium Achieved (Clause 4.4.2)';
    if (isEquilibriumLocked) {
      if (explicitStable === false) {
        stabilityNote = 'Rejected: Balance telemetry indicates active motion (US / S D)';
      } else {
        stabilityNote = `Rejected: Indication drift ${equilibriumDelta.toFixed(4)} > ${maxPermittedDelta.toFixed(4)} (1e limit)`;
      }
    }

    return {
      raw,
      weight,
      unit,
      isStable,
      timestamp: now,
      isEquilibriumLocked,
      equilibriumDelta,
      stabilityNote,
    };
  }

  /**
   * Disconnect and release the serial port
   */
  public async disconnect(): Promise<void> {
    this.stopSimulation();
    this.keepReading = false;
    try {
      if (this.reader) {
        await this.reader.cancel();
        this.reader.releaseLock();
        this.reader = null;
      }
      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      console.warn('Error closing serial port:', e);
    } finally {
      this.setStatus('DISCONNECTED');
    }
  }
}

export const webSerialDriver = new WebSerialDriver();
export default WebSerialDriver;
