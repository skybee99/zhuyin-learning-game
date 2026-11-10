(function (global) {
  'use strict';
  const RIDES = {
    carousel:'旋轉木馬', coaster:'雲霄飛車', ferris:'摩天輪',
    bumper:'碰碰車', pirate:'海盜船', train:'環島小火車'
  };
  const ERROR_TEXT = {
    parent_required:'家長通行碼有誤。', unauthorized:'邀請或房間憑證有誤。',
    room_full:'房間已有三位島友。', room_locked:'房主暫停了加入。',
    invalid_invite:'邀請已過期或無效。', invite_expired:'邀請已過期。',
    room_expired:'這個房間已結束。', room_unavailable:'房間已鎖定、過期或邀請無效。', room_closed:'房主已結束房間。',
    rooms_unavailable:'這個環境尚未開啟私人房間。',
    rate_limited:'請等一下再試。'
  };
  const inputFor = (root, name) => root.querySelector(`[name="${name}"]`);
  const LABELS = ['小兔','小熊','星星'];
  const $ = (root, selector) => root.querySelector(selector);

  class PrivateRoom {
    constructor(root, options) {
      this.root = root;
      this.options = options;
      this.generation = 0;
      this.retryCount = 0;
      this.mode = 'single';
      this.message = '單人探索';
      this.localOffer = null;
      this.receivedRides = new Set();
      this.pendingRideResults = new Map();
      this.clockOffset = 0;
      root.innerHTML = `
        <section class="room-card" aria-label="私人同樂">
          <div class="room-heading">
            <h2>私人同樂</h2>
            <p data-room-status role="status">單人探索</p>
            <button type="button" data-room-open>家長開啟私人房間</button>
          </div>
          <dialog class="room-dialog" data-room-dialog aria-label="家長房間設定">
            <form data-room-form autocomplete="off">
              <h3>由家長設定房間</h3>
              <p>最多三位島友。房間只分享遊戲中的位置和動作。</p>
              <label>家長通行碼 <input name="parentKey" type="password" required maxlength="256" autocomplete="off"></label>
              <label>好友邀請碼 <input name="invite" maxlength="300" spellcheck="false" autocapitalize="none" autocomplete="off"></label>
              <p data-room-error role="alert"></p>
              <div class="room-actions">
                <button type="submit" value="create">建立房間</button>
                <button type="submit" value="join">加入房間</button>
                <button type="button" data-room-cancel-dialog>關閉</button>
              </div>
            </form>
          </dialog>
          <div class="room-connected" data-room-connected hidden>
            <p data-room-count></p>
            <ul data-room-players class="room-players"></ul>
            <div data-room-host hidden>
              <details><summary>家長查看短期邀請碼</summary><label>好友邀請碼 <input name="share" readonly autocomplete="off" spellcheck="false"></label></details>
              <button type="button" data-room-lock>鎖定房間</button>
              <button type="button" data-room-end>結束房間</button>
            </div>
            <div class="room-actions">
              <button type="button" data-room-wave>揮手</button>
              <button type="button" data-room-joy>歡呼</button>
              <button type="button" data-room-leave>離開房間</button>
            </div>
            <div class="room-actions" data-room-offer-controls hidden>
              <label>同乘設施 <select name="ride">${Object.entries(RIDES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
              <button type="button" data-room-offer>邀請同乘</button>
            </div>
            <div class="room-offer" data-room-proposal hidden>
              <p data-room-offer-info role="status"></p>
              <div class="room-actions">
                <button type="button" data-room-ready>同意並預留 1 張券</button>
                <button type="button" data-room-decline>先不搭乘</button>
                <button type="button" data-room-start hidden>讓已準備的人出發</button>
                <button type="button" data-room-cancel-offer hidden>取消同乘</button>
              </div>
            </div>
          </div>
        </section>`;
      root.addEventListener('submit', (event) => this.submit(event));
      root.addEventListener('click', (event) => this.click(event));
      const dialog = $(root,'[data-room-dialog]');
      dialog.addEventListener('close',()=> {
        inputFor(root,'parentKey').value = '';
        inputFor(root,'invite').value = '';
      });
      global.addEventListener('online', () => {
        if (this.credentials && !this.socket) this.scheduleReconnect(0);
      });
      this.render();
    }

    async submit(event) {
      if (!event.target.matches('[data-room-form]')) return;
      event.preventDefault();
      const mode = event.submitter?.value === 'join' ? 'join' : 'create';
      if (this.mode !== 'single' || !this.options.childId()) return;
      const parentInput = inputFor(this.root,'parentKey');
      const parentKey = parentInput.value;
      const invite = inputFor(this.root,'invite').value.trim();
      parentInput.value = '';
      const errorNode = $(this.root,'[data-room-error]');
      errorNode.textContent = '';
      const [roomId, inviteToken, extra] = invite.split('.');
      if (mode === 'join' && (!roomId || !inviteToken || extra)) {
        errorNode.textContent = '請輸入房主提供的完整邀請碼。';
        return;
      }
      const generation = ++this.generation;
      const controller = new AbortController();
      const timer = setTimeout(()=>controller.abort(),10000);
      this.pendingRequest = controller;
      this.mode = 'connecting';
      this.message = '正在連線…';
      this.render();
      try {
        const response = await fetch('/api/rooms/' + mode, {
          method:'POST', cache:'no-store', credentials:'same-origin',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(mode === 'create' ? {parentKey} : {parentKey,roomId,inviteToken}),
          signal:controller.signal
        });
        const data = await response.json();
        if (generation !== this.generation) return;
        if (!response.ok || !data.roomId || !data.sessionId || !data.sessionToken) {
          const reason = data.error || data.code;
          errorNode.textContent = response.status === 503 ? ERROR_TEXT.rooms_unavailable :
            ERROR_TEXT[reason] || (response.status === 409 ? ERROR_TEXT.room_full : '無法進入房間，請核對通行碼和邀請。');
          this.mode = 'single';
          this.message = '單人探索';
          this.render();
          return;
        }
        this.credentials = data;
        this.child = this.options.childId();
        this.retryCount = 0;
        this.receivedRides.clear();
      this.pendingRideResults.clear();
        $(this.root,'[data-room-dialog]').close();
        this.connect();
      } catch (_) {
        if (generation !== this.generation) return;
        errorNode.textContent = '私人房間目前無法連線。';
        this.mode = 'single';
        this.message = '單人探索';
        this.render();
      } finally {
        clearTimeout(timer);
        if (this.pendingRequest === controller) this.pendingRequest = null;
      }
    }

    connect() {
      if (!this.credentials || this.socket) return;
      const {roomId,sessionId,sessionToken} = this.credentials;
      const url = new URL('/api/rooms/'+encodeURIComponent(roomId)+'/connect',location.origin);
      url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(url);
      this.socket = socket;
      const deadline = setTimeout(()=> {
        if (this.socket === socket && this.mode !== 'connected') socket.close();
      },8000);
      socket.addEventListener('open', () => {
        if (this.socket === socket) socket.send(JSON.stringify({type:'auth',sessionId,sessionToken}));
      });
      socket.addEventListener('message', ({data}) => {
        if (this.socket !== socket || typeof data !== 'string') return;
        try {
          const packet = JSON.parse(data);
          if (packet.type === 'welcome') clearTimeout(deadline);
          this.receive(packet);
        } catch (_) { /* non-JSON messages never reach UI */ }
      });
      socket.addEventListener('close', (event) => {
        clearTimeout(deadline);
        if (this.socket !== socket) return;
        this.socket = null;
        this.snapshot = null;
        this.options.onPeers([]);
        this.releaseOffer();
        if (!this.credentials) return;
        if (event.code === 1008 || event.code >= 4000 || this.retryCount >= 6) {
          this.disconnect(false,'房間已離開或憑證已失效，已回到單人探索。');
        } else {
          this.mode = 'reconnecting';
          this.message = '連線中斷，正在重新連線…';
          this.render();
          this.scheduleReconnect(Math.min(6000,600 * 2 ** this.retryCount++));
        }
      });
    }

    scheduleReconnect(delay) {
      clearTimeout(this.reconnectTimer);
      if (!navigator.onLine || !this.credentials) return;
      this.reconnectTimer = setTimeout(()=>this.connect(),delay);
    }

    send(packet) {
      if (this.mode !== 'connected' || this.socket?.readyState !== WebSocket.OPEN) return false;
      try { this.socket.send(JSON.stringify(packet)); return true; }
      catch (_) { return false; }
    }

    receive(packet) {
      if (packet.type === 'welcome' || packet.type === 'snapshot') {
        if (packet.type === 'welcome') {
          this.mode = 'connected';
          this.selfId = packet.selfId;
          this.role = packet.role;
          this.retryCount = 0;
          this.lastPosition = null;
          this.message = '私人同樂已連線，從中央廣場出發。';
          this.options.onWelcome?.();
          this.send({type:'plaza'});
          const appearance = this.options.appearance?.();
          if (appearance) this.send({type:'appearance',appearance});
        }
        this.snapshot = packet;
        this.clockOffset = Number.isFinite(packet.serverTime) ? packet.serverTime - Date.now() : 0;
        const peers = (packet.players || []).filter((p)=>p.sessionId !== this.selfId && p.connected !== false);
        this.options.onPeers(peers.map((p)=>({...p,label:this.playerLabel(p.sessionId)})));
        const ride = packet.ride;
        for (const [id,result] of this.pendingRideResults) {
          if (ride?.rideId !== id || this.send(result)) this.pendingRideResults.delete(id);
        }
        if (!ride || (this.localOffer && this.localOffer.rideId !== ride.rideId)) this.releaseOffer();
        if (ride?.status === 'started') this.startGroup(ride);
        this.render();
      } else if (packet.type === 'ride_started') {
        this.startGroup(packet);
      } else if (packet.type === 'ride_cancelled' && packet.rideId === this.localOffer?.rideId) {
        this.releaseOffer();
        this.message = '這次同乘已取消，開始前預留的遊樂券會退回。';
        this.render();
      } else if (packet.type === 'bumper_state' && packet.sessionId !== this.selfId) {
        this.options.onBumperPeer?.(packet);
      } else if (packet.type === 'room_closed') {
        this.disconnect(false,'房主已結束房間，已回到單人探索。');
      } else if (packet.type === 'error') {
        this.message = ERROR_TEXT[packet.error || packet.code] || '房間未接受這次操作。';
        this.render();
      }
    }

    finishRide(rideId, completed, exitId) {
      const result = {type:completed ? 'ride_done' : 'ride_abort',rideId};
      if (completed && exitId) result.exitId = exitId;
      if (this.send(result)) return true;
      if (this.credentials) {
        // A deferred exit must not relocate the peer until the local scene can move with it.
        delete result.exitId;
        this.pendingRideResults.set(rideId,result);
      }
      return false;
    }

    playerLabel(id) {
      const slot = this.snapshot?.players?.findIndex((p)=>p.sessionId === id) ?? -1;
      return slot < 0 ? '島友' : LABELS[slot] || '島友';
    }

    position(position) {
      const now = performance.now();
      if (now - (this.lastMove || 0) < 105) return;
      const signature = JSON.stringify(position);
      if (signature === this.lastPosition) return;
      if (this.send({type:'move',x:position.x,z:position.z,direction:position.direction,action:position.action})) {
        this.lastMove = now;
        this.lastPosition = signature;
      }
    }

    appearance(appearance) {
      if (appearance) this.send({type:'appearance',appearance});
    }

    resetPlaza() {
      this.lastPosition = null;
      this.send({type:'plaza'});
    }

    async ready() {
      const ride = this.snapshot?.ride;
      const ledger = this.options.ledger();
      if (this.localOffer || this.mode !== 'connected' || ride?.status !== 'offered' || !ledger || !this.options.canRide()) return;
      const reservation = {rideId:ride.rideId,operationId:crypto.randomUUID(),childId:this.child,ledger};
      this.localOffer = reservation;
      this.render();
      try {
        const result = await ledger.reserveRide(reservation.childId,{
          operationId:reservation.operationId,ride:ride.ride,startPolicy:global.TicketLedger.PAINT_ACK_POLICY
        });
        if (result.reservation?.status !== 'reserved' || this.localOffer !== reservation ||
          this.snapshot?.ride?.rideId !== ride.rideId || !this.send({type:'ride_ready',rideId:ride.rideId,ready:true})) {
          await ledger.cancelRide(reservation.childId,reservation.operationId).catch(()=>{});
          if (this.localOffer === reservation) this.localOffer = null;
        }
      } catch (_) {
        if (this.localOffer === reservation) this.localOffer = null;
        this.message = '無法預留遊樂券，這次仍可留在島上。';
      } finally {
        this.options.refreshBalance();
        this.render();
      }
    }

    releaseOffer() {
      const reservation = this.localOffer;
      this.localOffer = null;
      if (!reservation) return;
      reservation.ledger.cancelRide(reservation.childId,reservation.operationId)
        .catch(()=>{}).finally(()=>this.options.refreshBalance());
    }

    startGroup(packet) {
      const rideId = packet.rideId;
      if (!rideId || this.receivedRides.has(rideId)) return;
      this.receivedRides.add(rideId);
      const reservation = this.localOffer;
      if (reservation?.rideId !== rideId) return;
      const participants = (packet.participants || []).filter((p)=>typeof p === 'string' || p.ready)
        .map((p)=>typeof p === 'string' ? p : p.sessionId);
      if (!participants.includes(this.selfId) || !this.options.canRide()) {
        this.releaseOffer();
        if (participants.includes(this.selfId)) this.finishRide(rideId,false);
        return;
      }
      this.localOffer = null;
      const started = this.options.startRide(packet.ride,{
        operationId:reservation.operationId,startsAt:packet.startsAt - this.clockOffset,
        participants:participants.map((sessionId)=>({sessionId,appearance:this.snapshot?.players?.find((p)=>p.sessionId === sessionId)?.appearance})),
        selfId:this.selfId,sessionRideId:rideId,
        onBumperMove:(point)=>this.send({type:'bumper_move',rideId,x:point.x,z:point.z})
      });
      if (!started) {
        this.finishRide(rideId,false);
        reservation.ledger.cancelRide(reservation.childId,reservation.operationId).catch(()=>{}).finally(()=>this.options.refreshBalance());
      }
      this.render();
    }

    disconnect(notify = true, message = '已回到單人探索') {
      if (notify) this.send({type:'leave'});
      this.generation++;
      this.pendingRequest?.abort();
      this.pendingRequest = null;
      clearTimeout(this.reconnectTimer);
      const socket = this.socket;
      this.socket = null;
      this.credentials = null;
      this.snapshot = null;
      this.role = null;
      this.selfId = null;
      this.receivedRides.clear();
      this.pendingRideResults.clear();
      this.releaseOffer();
      socket?.close();
      this.mode = 'single';
      this.message = message;
      const dialog = $(this.root,'[data-room-dialog]');
      if (dialog.open) dialog.close();
      this.options.onPeers([]);
      this.render();
    }

    click(event) {
      const button = event.target.closest('button');
      if (!button) return;
      const ride = this.snapshot?.ride;
      if (button.hasAttribute('data-room-open')) {
        $(this.root,'[data-room-error]').textContent = '';
        $(this.root,'[data-room-dialog]').showModal();
      } else if (button.hasAttribute('data-room-cancel-dialog')) {
        if (this.mode === 'connecting') this.disconnect(false);
        else $(this.root,'[data-room-dialog]').close();
      } else if (button.hasAttribute('data-room-leave')) {
        this.disconnect();
      } else if (button.hasAttribute('data-room-end')) {
        this.send({type:'close'});
      } else if (button.hasAttribute('data-room-lock')) {
        this.send({type:'lock',locked:!this.snapshot?.locked});
      } else if (button.dataset.roomKick) {
        this.send({type:'kick',targetId:button.dataset.roomKick});
      } else if (button.hasAttribute('data-room-wave') || button.hasAttribute('data-room-joy')) {
        this.options.gesture(button.hasAttribute('data-room-wave') ? 'wave' : 'joy');
      } else if (button.hasAttribute('data-room-offer') && this.options.canRide()) {
        this.send({type:'ride_offer',ride:inputFor(this.root,'ride').value});
      } else if (button.hasAttribute('data-room-ready')) {
        this.ready();
      } else if (button.hasAttribute('data-room-decline') && ride?.status === 'offered') {
        this.releaseOffer();
        this.send({type:'ride_ready',rideId:ride.rideId,ready:false});
        this.render();
      } else if (button.hasAttribute('data-room-start') && ride?.status === 'offered') {
        this.send({type:'ride_start',rideId:ride.rideId});
      } else if (button.hasAttribute('data-room-cancel-offer') && ride?.status === 'offered') {
        this.send({type:'ride_cancel',rideId:ride.rideId});
      }
    }

    render() {
      const root = this.root;
      const connected = this.mode === 'connected';
      const snapshot = this.snapshot;
      $(root,'[data-room-status]').textContent = this.message;
      $(root,'[data-room-open]').hidden = this.mode !== 'single';
      $(root,'[data-room-connected]').hidden = this.mode === 'single' || this.mode === 'connecting';
      $(root,'[data-room-host]').hidden = !connected || this.role !== 'host';
      $(root,'[data-room-lock]').textContent = snapshot?.locked ? '解除鎖定' : '鎖定房間';
      inputFor(root,'share').value = this.credentials?.inviteToken ? `${this.credentials.roomId}.${this.credentials.inviteToken}` : '';
      const players = snapshot?.players || [];
      $(root,'[data-room-count]').textContent = `在線島友 ${players.filter((p)=>p.connected !== false).length}／3`;
      $(root,'[data-room-players]').replaceChildren(...players.map((p)=>{
        const row = document.createElement('li');
        row.textContent = `${this.playerLabel(p.sessionId)}${p.sessionId === this.selfId ? '（我）' : ''}${p.connected === false ? '（連線中斷）' : ''}`;
        if (connected && this.role === 'host' && p.sessionId !== this.selfId) {
          const kick = document.createElement('button');
          kick.type = 'button';
          kick.dataset.roomKick = p.sessionId;
          kick.textContent = '移除';
          row.append(' ',kick);
        }
        return row;
      }));
      const ride = snapshot?.ride;
      $(root,'[data-room-offer-controls]').hidden = !connected || this.role !== 'host' || Boolean(ride);
      $(root,'[data-room-proposal]').hidden = !connected || !ride;
      if (!ride) return;
      const offered = ride.status === 'offered';
      const readyCount = (ride.participants || []).filter((p)=>p.ready).length;
      $(root,'[data-room-offer-info]').textContent = offered ?
        `${RIDES[ride.ride] || '設施'}邀請，${readyCount} 位已準備。可自行選擇是否搭乘。` : `${RIDES[ride.ride] || '設施'}同乘中`;
      $(root,'[data-room-ready]').hidden = !offered;
      $(root,'[data-room-ready]').disabled = Boolean(this.localOffer);
      $(root,'[data-room-decline]').hidden = !offered;
      $(root,'[data-room-start]').hidden = !offered || this.role !== 'host';
      $(root,'[data-room-start]').disabled = readyCount < 2;
      $(root,'[data-room-cancel-offer]').hidden = !offered || this.role !== 'host';
    }
  }

  global.IslandRooms = Object.freeze({PrivateRoom,RIDES});
})(globalThis);
