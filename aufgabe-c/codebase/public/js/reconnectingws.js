class ReconnectingWebSocketClient {
    constructor(url, options = {}) {
      this.url = url;
      this.ws = null;
  
      this.shouldReconnect = true;
  
      this.initialDelay = options.initialDelay ?? 1000;
      this.maxDelay = options.maxDelay ?? 15000;
      this.backoffFactor = options.backoffFactor ?? 2;
      this.delay = this.initialDelay;
  
      this.connectTimeoutMs = options.connectTimeoutMs ?? 10000;
      this.connectTimer = null;
  
      this.messageQueue = [];
      this.pingInterval = null;
    }

    startHeartbeat() {
        clearInterval(this.pingInterval);

        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send({ type: "ping", ts: Date.now() });
            }
        }, 10000);
    }
  
    connect() {
      if (this.ws && (
        this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING
      )) {
        return;
      }
  
      this.ws = new WebSocket(this.url);
  
      this.connectTimer = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.warn("WebSocket connect timeout, closing socket");
          this.ws.close();
        }
      }, this.connectTimeoutMs);
  
      this.ws.addEventListener("open", () => {
        console.log("WebSocket connected");
        clearTimeout(this.connectTimer);
  
        this.delay = this.initialDelay;
  
        while (this.messageQueue.length && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(this.messageQueue.shift());
        }

        this.startHeartbeat();
  
        this.onOpen();
      });
  
      this.ws.addEventListener("message", (event) => {
        this.onMessage(event);
      });
  
      this.ws.addEventListener("error", (event) => {
        console.error("WebSocket error", event);
        this.onError(event);
  
        // Usually let "close" handle reconnect.
        // Some environments fire both error and close.
      });
  
      this.ws.addEventListener("close", (event) => {
        console.warn("WebSocket closed", event.code, event.reason);
        clearTimeout(this.connectTimer);
        this.onClose(event);
  
        if (!this.shouldReconnect) return;
  
        const timeout = this.delay + Math.random() * 500;
        console.log(`Reconnecting in ${Math.round(timeout)}ms`);
  
        setTimeout(() => {
          if (this.shouldReconnect) {
            this.connect();
          }
        }, timeout);
  
        this.delay = Math.min(this.delay * this.backoffFactor, this.maxDelay);
      });
    }
  
    send(data) {
      const payload = typeof data === "string" ? data : JSON.stringify(data);
  
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(payload);
      } else {
        this.messageQueue.push(payload);
      }
    }
  
    close(simulate_reconnect = false) {
        if (!simulate_reconnect) {
            this.shouldReconnect = false;
            clearTimeout(this.connectTimer);
        }
  
      if (this.ws) {
        this.ws.close(1000, "Client closed connection intentionally");
      }
    }
  
    onOpen() {
      
    }
  
    onMessage(event) {
    }
  
    onError(event) {
      
    }
  
    onClose(event) {
      
    }
  }