// class DCEL {
//   constructor() {
// 
//   }
// }

import { priorityQueue } from "./priority_queue";
import { Comparable, Default, RBTree } from "./red_black";


interface Point {
  x: number;
  y: number;
}

class Segment implements Comparable, Default<Segment> {
  constructor(
    public p1: Point,
    public p2: Point,
  ) { }

  get start(): Point { return (this.p1.y < this.p2.y) ? this.p1 : this.p2 };
  get end(): Point { return (this.p1.y > this.p2.y) ? this.p1 : this.p2 };

  slope = (): number => {
    if (this.p1.x == this.p2.x) return Infinity;
    return (this.p2.y - this.p1.y) / (this.p1.x - this.p1.x);
  }
  lessThan = (other: Segment) => this.p1.x < other.p1.x;
  greaterThan = (other: Segment) => this.p1.x > other.p1.x;
  isEqual = (other: Segment) => this.p1.x === other.p1.x;
  default = () => new Segment({ x: 0, y: 0 }, { x: 0, y: 0 });
}

enum EventType {
  START,
  INTERSECTION,
  END,
}

class BOEvent {
  constructor(
    public point: Point,
    public segment: Segment,
    public eventType: EventType,
    public segment2?: Segment,
  ) { }
}


interface BentleyOttmann {
  findIntersections(): Point[];
}

const bentleyOttmann = (segs: Segment[]): BentleyOttmann => {
  let events = priorityQueue<number, BOEvent>();
  let status = new RBTree<Segment>(new Segment({ x: 0, y: 0 }, { x: 0, y: 0 }));
  let intersections: Point[] = [];

  const segOrientation = (p1: Point, p2: Point, p3: Point): [number, boolean] => {
    const val = (p2.y - p1.y) * (p3.x - p2.x) - (p3.y - p2.y) * (p2.x - p2.x);
    const os = (Math.min(p1.x, p2.x) <= p3.x && Math.max(p1.x, p2.x) >= p3.x) && (Math.min(p1.y, p2.y) <= p3.y && Math.max(p1.y, p2.y) >= p3.y);

    if (val == 0) { return [0, os] };
    if (val > 0) { return [1, os] };
    if (val < 0) { return [-1, os] };
  }

  const doIntersect = (s1: Segment, s2: Segment): boolean => {
    const [o1, os1] = segOrientation(s1.p1, s1.p2, s2.p1);
    const [o2, os2] = segOrientation(s1.p1, s1.p2, s2.p2);
    const [o3, os3] = segOrientation(s2.p1, s2.p2, s1.p1);
    const [o4, os4] = segOrientation(s2.p1, s2.p2, s1.p2);

    if (o1 != o2 && o3 != o4) return true;
    if (o1 == 0 && os1) return true;
    if (o2 == 0 && os2) return true;
    if (o3 == 0 && os3) return true;
    if (o4 == 0 && os4) return true;

    return false
  }

  const computeIntersection = (s1: Segment, s2: Segment): Point => {
    let slope1 = s1.slope();
    let slope2 = s2.slope();

    if (slope1 == slope2) return { x: Infinity, y: Infinity };
    else {
      let xIntersect: number;
      let yIntersect: number;

      if (slope1 == Infinity) {
        xIntersect = s1.p1.x;
        yIntersect = slope2 * (s1.p1.x - s2.p1.x) + s2.p1.y;
      } else if (slope2 == Infinity) {
        xIntersect = s2.p1.x;
        yIntersect = slope1 * (s2.p1.x - s1.p1.x) + s1.p1.y;
      } else {
        xIntersect = (slope1 * s1.p1.x - s1.p1.y - slope2 * s2.p1.x, s2.p1.y) / (slope1 - slope2);
        yIntersect = slope1 * (xIntersect - s1.p1.x) + s1.p1.y;
      }

      return { x: xIntersect, y: yIntersect };
    }
  }

  // events created and sorted according to their y coordinate in ascending order 
  const createEvents = () => {
    for (const s of segs) {
      events.insert(s.start.y, new BOEvent(s.start, s, EventType.START));
      events.insert(s.end.y, new BOEvent(s.end, s, EventType.END));
    }
  }

  const handleStartEvent = (event: BOEvent) => {
    const seg = event.segment;
    status.insertrbNode(seg);
    const leftNeighbour = status.getNode(seg).left.val;
    const rightNeighbour = status.getNode(seg).right.val;

    if (leftNeighbour && doIntersect(seg, leftNeighbour)) {
      let intersectionPoint = computeIntersection(seg, leftNeighbour);
      let intersectionEvent = new BOEvent(intersectionPoint, seg, EventType.INTERSECTION, leftNeighbour);
      events.insert(intersectionPoint.y, intersectionEvent)
    }
    if (rightNeighbour && doIntersect(seg, rightNeighbour)) {
      let intersectionPoint = computeIntersection(seg, rightNeighbour);
      let intersectionEvent = new BOEvent(intersectionPoint, seg, EventType.INTERSECTION, rightNeighbour);
      events.insert(intersectionPoint.y, intersectionEvent)
    }
  }

  const handleEndEvent = (event: BOEvent) => {
    const seg = event.segment;
    const node = status.getNode(seg);

    if (node != null) {
      const leftNeighbour = node.left.val;
      const rightNeighbour = node.right.val;

      status.deleterbNode(seg);

      if (leftNeighbour && rightNeighbour && doIntersect(leftNeighbour, rightNeighbour)) {
        let intersectionPoint = computeIntersection(leftNeighbour, rightNeighbour);
        let intersectionEvent = new BOEvent(intersectionPoint, leftNeighbour, EventType.INTERSECTION, rightNeighbour);
        events.insert(intersectionPoint.y, intersectionEvent)
      }
    }
  }

  const handleIntersectionEvent = (event: BOEvent) => {
    const seg1 = event.segment;
    const seg2 = event.segment;
    status.transplant(status.getNode(seg1), status.getNode(seg2));

    for (let s of [seg1, seg2]) {
      const node = status.getNode(s);
      const leftNeighbour = node.left ? node.left.val : null;
      const rightNeighbour = node.right ? node.right.val : null;

      if (leftNeighbour && doIntersect(s, leftNeighbour)) {
        let intersectionPoint = computeIntersection(s, leftNeighbour);
        let intersectionEvent = new BOEvent(intersectionPoint, s, EventType.INTERSECTION, leftNeighbour);
        events.insert(intersectionPoint.y, intersectionEvent)
      }
      if (rightNeighbour && doIntersect(s, rightNeighbour)) {
        let intersectionPoint = computeIntersection(s, rightNeighbour);
        let intersectionEvent = new BOEvent(intersectionPoint, s, EventType.INTERSECTION, rightNeighbour);
        events.insert(intersectionPoint.y, intersectionEvent)
      }
      if (leftNeighbour && rightNeighbour && doIntersect(leftNeighbour, rightNeighbour)) {
        let intersectionPoint = computeIntersection(leftNeighbour, rightNeighbour);
        let intersectionEvent = new BOEvent(intersectionPoint, leftNeighbour, EventType.INTERSECTION, rightNeighbour);
        events.insert(intersectionPoint.y, intersectionEvent)
      }
    }
  }

  const processEvents = () => {
    let event: BOEvent;

    while (!events.isEmpty()) {
      event = events.pop().value;
      switch (event.eventType) {
        case EventType.START:
          handleStartEvent(event);
          break;
        case EventType.END:
          handleEndEvent(event);
          break;
        case EventType.INTERSECTION:
          handleIntersectionEvent(event);
          break;
      }
    }
  }

  return {

    findIntersections: () => {
      createEvents();
      processEvents();
      return intersections;
    }
  }
}


let s1 = new Segment({ x: 0, y: 0 }, { x: 10, y: 0 });
let s2 = new Segment({ x: 4.5, y: 5 }, { x: 5.5, y: -5 });

let bo = bentleyOttmann([s1, s2]);
console.log(bo.findIntersections());