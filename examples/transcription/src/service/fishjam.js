import { FishjamClient, RoomNotFoundException } from '@fishjam-cloud/js-server-sdk';
export class FishjamService {
    constructor(config) {
        this.fishjam = new FishjamClient(config);
    }
    async createPeer() {
        try {
            return await this.makePeer();
        }
        catch (e) {
            if (e instanceof RoomNotFoundException) {
                await this.makeRoom();
                return this.makePeer();
            }
            throw e;
        }
    }
    async createAgent() {
        try {
            return await this.makePeer();
        }
        catch (e) {
            if (e instanceof RoomNotFoundException) {
                await this.makeRoom();
                return this.makePeer();
            }
            throw e;
        }
    }
    async makeRoom() {
        const { id: roomId } = await this.fishjam.createRoom();
        this.roomId = roomId;
    }
    async makePeer() {
        if (!this.roomId)
            await this.makeRoom();
        return this.fishjam.createPeer(this.roomId, 'agent', { subscribe: { audioSampleRate: 16000 } });
    }
}
