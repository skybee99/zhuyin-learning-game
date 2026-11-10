(function (global) {
  'use strict';
  class Island3DApp {
    constructor(options) {
      this.options = options;
      this.scene = document.getElementById('world3d');
      this.rideRoot = document.getElementById('ride3d');
      this.room = new global.IslandRooms.PrivateRoom(document.getElementById('roomPanel'),{
        childId:options.childId, ledger:options.ledger, refreshBalance:options.refreshBalance,
        appearance:()=>global.Island3D.getAppearance?.() || this.savedAppearance(),
        canRide:()=>this.active && !this.rideHandle && !document.hidden,
        onPeers:(peers)=>{ this.peers = peers; global.Island3D.setPeers(peers); },
        onWelcome:()=>global.Island3D.resetPlaza?.({silent:true}),
        gesture:(action)=>global.Island3D.gesture?.(action),
        startRide:(type,group)=>this.play(type,group),
        onBumperPeer:(packet)=>{
          if (this.group?.sessionRideId === packet.rideId)
            this.rideHandle?.setBumperPeer(packet.sessionId,{x:packet.x,z:packet.z});
        }
      });
      document.getElementById('islandBack2D').addEventListener('click',()=>this.backTo2D());
      document.getElementById('rides3dJump').addEventListener('click',()=>{
        if (this.rideHandle) return;
        const list = document.getElementById('ride3dList');
        list.hidden = !list.hidden;
      });
      document.getElementById('ride3dList').addEventListener('click',(event)=>{
        const button = event.target.closest('[data-ride3d]');
        if (button) this.play(button.dataset.ride3d);
      });
      global.addEventListener('pagehide',()=>this.room.disconnect());
    }

    savedAppearance() {
      const appearance = global.IslandExplore.snapshot(this.options.childId())?.appearance;
      return appearance || {hair:'short',color:'#ee8f83',accessory:'none'};
    }

    enter() {
      this.active = true;
      this.scene.hidden = false;
      this.rideRoot.hidden = true;
      const success = global.Island3D.mount(this.scene,{
        childId:this.options.childId(), getSettings:this.options.settings,
        getProfile:this.options.getProfile, getBalance:this.options.getBalance,
        navigate:this.options.navigate, ride:(type)=>this.play(type), speak:this.options.speak,
        stopSpeech:this.options.stopSpeech, onFallback:(message)=>this.backTo2D(message),
        onPosition:(position)=>this.room.position(position),
        onAppearance:(appearance)=>this.room.appearance(appearance),
        onGesture:(action)=>this.room.announceGesture(action),
        onPlaza:()=>this.room.resetPlaza()
      });
      if (success) global.Island3D.setPeers(this.peers || []);
      else if (this.active) this.backTo2D('這台裝置目前無法啟用 WebGL2，已開啟 2D 動物島。');
    }

    leave() {
      this.active = false;
      const list = document.getElementById('ride3dList');
      list.hidden = true;
      global.Island3D.leave();
      if (this.rideHandle) this.rideHandle.close();
      this.rideHandle = null;
      this.group = null;
      this.rideRoot.hidden = true;
      this.options.stopSpeech();
    }

    resetChild() {
      this.leave();
      this.room.disconnect();
    }

    backTo2D(message) {
      if (!this.active) return;
      this.room.disconnect();
      this.options.navigate('islandView');
      if (message) this.options.report(typeof message === 'string' ? message : '3D 畫面中斷，已開啟 2D 動物島。');
    }

    play(type, group) {
      if (!this.active || !Object.hasOwn(global.IslandRooms.RIDES,type) || this.rideHandle || document.hidden) return false;
      const child = this.options.childId();
      const ledger = this.options.ledger();
      if (!child || !ledger) {
        this.options.report('遊樂券帳本暫時無法使用。');
        return false;
      }
      document.getElementById('ride3dList').hidden = true;
      this.group = group;
      global.Island3D.leave();
      this.options.stopSpeech();
      this.scene.hidden = true;
      this.rideRoot.hidden = false;
      try {
        const handle = global.IslandRides3D.open({
          type,container:this.rideRoot,childId:child,ledger,group,
          appearance:this.savedAppearance(), settings:this.options.settings(),
          onBalanceChange:this.options.refreshBalance, speak:this.options.speak,
          onClose:(result)=>{
            const sameChild = child === this.options.childId();
            const exitId = result?.type === 'train' && ['plaza','village','garden'].includes(result.exitId) ? result.exitId : null;
            const completed = !group || (sameChild && this.room.finishRide(group.sessionRideId,Boolean(result?.completed),exitId));
            if (this.rideHandle !== handle) return;
            this.rideHandle = null;
            this.group = null;
            if (this.active && sameChild) {
              this.enter();
              if (exitId && completed) global.Island3D.moveTo?.(exitId);
            }
          }
        });
        this.rideHandle = handle;
        return Boolean(handle);
      } catch (_) {
        this.group = null;
        this.backTo2D('3D 設施無法啟動，已開啟 2D 動物島。');
        return false;
      }
    }
  }

  global.Island3DApp = Island3DApp;
})(globalThis);
