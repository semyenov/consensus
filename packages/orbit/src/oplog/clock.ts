export interface ClockInstance {
  id: string
  time: number

  tick: () => ClockInstance
  clone: () => ClockInstance
}

export class Clock implements ClockInstance {
  constructor(
    public id: string,
    public time: number = 0,
  ) {}

  static create(id: string, time?: number): Clock {
    return new Clock(id, time)
  }

  static compare(a: ClockInstance, b: ClockInstance): number {
    const dist = a.time - b.time

    if (dist === 0 && a.id !== b.id) {
      return a.id < b.id ? -1 : 1
    }

    return dist
  }

  tick(): Clock {
    return new Clock(this.id, this.time + 1)
  }

  clone(): Clock {
    return new Clock(this.id, this.time)
  }
}
