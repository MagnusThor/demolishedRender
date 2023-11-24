export class Scene {
    ms: number = 0
    msStart: number = 0;
    msStop: number = 0;
    constructor(public key: string, public duration: number, public uniforms: any) {
    }
}

export class DasSequencer {

    time: number;
    sec: number = 60;
    min: number = 1000 * 60;
    msPerBeat: number;
    msPerTick: number;
    scenes: Map<string, Scene>;
    isPlaying: boolean = false;
    frame: number = 0;
    timeDiff: number = 0;
    now: number = 0;

    tick: number = 0;
    beat: number = 0;
    oldTick: number = 0;
    oldBeat: number = 0;


    onBeat: (beat: number, scenes: Scene[]) => void;

    duration: number = 0;

    constructor(bpm: number, tpb: number) {
        this.time = 0;
        this.msPerBeat = this.min / bpm;
        this.msPerTick = this.msPerBeat / tpb;
        this.scenes = new Map<string, Scene>();
    }

    msToMinutesAndSeconds(milliseconds: number): {
        minutes: number, seconds: number
    } {
        var minutes = Math.floor(milliseconds / 60000);
        var seconds = Math.floor((milliseconds % 60000) / 1000);

        return {
            minutes: minutes,
            seconds: seconds
        };
    }


    beatToMs(beat: number): number {
        return Math.abs((this.timeDiff + this.now) - beat * this.msPerBeat);
    }

    getScenesToPlay(time: number): Array<Scene> {
        return Array.from(this.scenes.values()).filter(pre => {
            return time >= pre.msStart && time <= pre.msStop
        });
    }

    getSceneByBeat(beat: number) {
        return this.getScenesToPlay(this.beatToMs(beat));
    }

    setProps(time: number) {

        this.timeDiff = 0;

        this.now = time - this.timeDiff
        this.tick = (this.now / this.msPerTick) | 0
        this.beat = (this.now / this.msPerBeat) | 0

        if (this.tick != this.oldTick) {
            this.oldTick = this.tick;
        }
        if (this.beat != this.oldBeat) {
            this.oldBeat = this.beat;
            if (this.onBeat)
                this.onBeat(this.beat, this.getScenesToPlay(this.time));
        }
    }

    goTo(beat: number) {
        this.timeDiff = this.timeDiff + this.now - beat * this.msPerBeat;
    }

    addScene(scene: Scene): this {
        scene.ms = scene.duration * this.msPerBeat;
        scene.msStart = this.duration;
        scene.msStop = this.duration + scene.ms;
        this.scenes.set(scene.key, scene);
        this.duration += scene.ms;
        return this;
    }

    addScenes(scens: Array<Scene>) {
        scens.forEach(s => {
            console.log(s.uniforms);
            this.addScene(s);
        });
        return this;
    }

    run(t: number, cb?: (t: Scene[], beat: number) => void): void {

        this.isPlaying = true;
        this.frame++;
        this.time = t;
        this.setProps(t);




        cb(this.getScenesToPlay(this.time), this.beat);




    }
}