// https://itnext.io/priority-queue-in-typescript-6ef23116901
interface pNode<T, U> {
  key: T
  value: U
}

interface PriorityQueue<T, U> {
  insert(priority: T, item: U): void
  peek(): pNode<T, U> | null
  pop(): pNode<T, U> | null
  size(): number
  isEmpty(): boolean
  print(): void
}

export const priorityQueue = <T, U>(): PriorityQueue<T, U> => {
  let heap: pNode<T, U>[] = [];

  const parent = (index: number) => Math.floor((index - 1) / 2);
  const left = (index: number) => 2 * index + 1;
  const right = (index: number) => 2 * index + 2;
  const hasLeft = (index: number) => left(index) < heap.length;
  const hasRight = (index: number) => right(index) < heap.length;

  const swap = (a: number, b: number) => {
    [heap[a], heap[b]] = [heap[b], heap[a]]
  }

  return {

    isEmpty: () => heap.length == 0,

    peek: () => heap.length == 0 ? null : heap[0],

    size: () => heap.length,

    insert: (prio, item) => {
      heap.push({ key: prio, value: item })

      let i = heap.length - 1;
      while (i > 0) {
        const p = parent(i);
        if (heap[p].key < heap[i].key) break;
        [heap[i], heap[p]] = [heap[p], heap[i]];
        i = p;
      }
    },

    pop: () => {
      const item = heap.pop()
      if (item == undefined) return null;

      swap(0, heap.length - 1);
      let current = 0;
      while (hasLeft(current)) {
        let smallerChild = left(current);
        if (hasRight(current) && heap[right(current)].key < heap[left(current)].key)
          smallerChild = right(current);

        if (heap[smallerChild].key > heap[current].key) break;

        swap(current, smallerChild);
        current = smallerChild;
      }

      return item
    },

    print: () => heap.forEach((s) => { console.log("key: ", s.key, "\nval: ", s.value) }),
  }
}
