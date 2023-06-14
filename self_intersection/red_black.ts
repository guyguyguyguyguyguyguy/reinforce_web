// https://www.programiz.com/dsa/red-black-tree

export interface Comparable {
  lessThan(other: Comparable): boolean;
  greaterThan(other: Comparable): boolean;
  isEqual(other: Comparable): boolean;
}

export interface Default<T> {
  default(): T;
}

interface rbNode<T extends Comparable & Default<T>> {
  val: T;         // Value of rbNode
  parent: rbNode<T> | null;   // Parent of rbNode
  left: rbNode<T> | null;     // Left Child of rbNode
  right: rbNode<T> | null;    // Right Child of rbNode
  colour: number;  // 0 for black, 1 for red
}

export class RBTree<T extends Comparable & Default<T>> {
  private NULL: rbNode<T>;
  private root: rbNode<T>;

  constructor(initRootVal: T) {
    // this.NULL = this.createrbNode(initRootVal.default());
    // this.NULL.colour = 0;
    // this.NULL.left = null;
    // this.NULL.right = null;
    this.NULL = null;
    this.root = this.NULL;
  }

  private createrbNode(val: T): rbNode<T> {
    return {
      val,
      parent: null,
      left: null,
      right: null,
      colour: 1,
    };
  }

  // Insert New rbNode
  public insertrbNode(key: T): void {
    const node = this.createrbNode(key);
    node.parent = null;
    node.val = key;
    node.left = this.NULL;
    node.right = this.NULL;
    node.colour = 1; // Set node colour as Red

    let y: rbNode<T> | null = null;
    let x: rbNode<T> | null = this.root;

    while (x !== this.NULL) {
      y = x;
      if (node.val.lessThan(x.val)) {
        x = x.left;
      } else {
        x = x.right;
      }
    }

    node.parent = y;
    if (y === null) {
      this.root = node;
    } else if (node.val.lessThan(y.val)) {
      y.left = node;
    } else {
      y.right = node;
    }

    if (node.parent === null) {
      node.colour = 0; // Root node is always black
      return;
    }

    if (node.parent.parent === null) {
      return;
    }

    this.fixInsert(node);
  }

  private minimum(node: rbNode<T>): rbNode<T> {
    while (node.left !== this.NULL && node.left !== null) {
      node = node.left;
    }
    return node;
  }

  private leftRotate(x: rbNode<T>): void {
    const y = x.right;
    x.right = y.left;
    if (y.left !== this.NULL) {
      y.left.parent = x;
    }

    y.parent = x.parent;
    if (x.parent === null) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }

    y.left = x;
    x.parent = y;
  }

  private rightRotate(x: rbNode<T>): void {
    const y = x.left;
    x.left = y.right;
    if (y.right !== this.NULL) {
      y.right.parent = x;
    }

    y.parent = x.parent;
    if (x.parent === null) {
      this.root = y;
    } else if (x === x.parent.right) {
      x.parent.right = y;
    } else {
      x.parent.left = y;
    }

    y.right = x;
    x.parent = y;
  }

  private fixInsert(k: rbNode<T>): void {
    let x = k;

    while (x.parent!.colour === 1) {
      if (x.parent === x.parent.parent!.right) {
        const u = x.parent.parent!.left;
        if (u.colour === 1) {
          u.colour = 0;
          x.parent!.colour = 0;
          x.parent!.parent!.colour = 1;
          x = x.parent!.parent!;
        } else {
          if (x === x.parent!.left) {
            x = x.parent!;
            this.rightRotate(x);
          }
          x.parent!.colour = 0;
          x.parent!.parent!.colour = 1;
          this.leftRotate(x.parent!.parent!);
        }
      } else {
        const u = x.parent!.parent!.right;
        if (u !== null && u.colour === 1) {
          u.colour = 0;
          x.parent!.colour = 0;
          x.parent!.parent!.colour = 1;
          x = x.parent!.parent!;
        } else {
          if (x === x.parent!.right) {
            x = x.parent!;
            this.leftRotate(x);
          }
          x.parent!.colour = 0;
          x.parent!.parent!.colour = 1;
          this.rightRotate(x.parent!.parent!);
        }
      }

      if (x === this.root) {
        break;
      }
    }

    this.root.colour = 0; // Set colour of root as black
  }

  private fixDelete(x: rbNode<T>): void {
    while (x !== this.root && x.colour === 0 && x !== this.NULL) {
      if (x === x.parent!.right) {
        let s = x.parent!.right;
        if (s.colour === 1) {
          s.colour = 0;
          x.parent!.colour = 1;
          this.leftRotate(x.parent!);
          s = x.parent!.right;
        }

        if (s.left!.colour === 0 && s.right!.colour === 0) {
          s.colour = 1;
          x = x.parent!;
        } else {
          if (s.right!.colour === 0) {
            s.left!.colour = 0;
            s.colour = 1;
            this.rightRotate(s);
            s = x.parent!.right;
          }

          s.colour = x.parent!.colour;
          x.parent!.colour = 0;
          s.right!.colour = 0;
          this.leftRotate(x.parent!);
          x = this.root;
        }
      } else {
        let s = x.parent!.left;
        if (s.colour === 1) {
          s.colour = 0;
          x.parent!.colour = 1;
          this.rightRotate(x.parent!);
          s = x.parent!.left;
        }

        if (s.right!.colour === 0 && s.left!.colour === 0) {
          s.colour = 1;
          x = x.parent!;
        } else {
          if (s.left!.colour === 0) {
            s.right!.colour = 0;
            s.colour = 1;
            this.leftRotate(s);
            s = x.parent!.left;
          }

          s.colour = x.parent!.colour;
          x.parent!.colour = 0;
          s.left!.colour = 0;
          this.rightRotate(x.parent!);
          x = this.root;
        }
      }
    }

    x.colour = 0;
  }

  transplant(u: rbNode<T>, v: rbNode<T>): void {
    if (u.parent === null) {
      this.root = v;
    } else if (u === u.parent.left) {
      u.parent.left = v;
    } else {
      u.parent.right = v;
    }

    v.parent = u.parent;
  }

  private deleterbNodeHelper(node: rbNode<T>, key: T): void {
    let z: rbNode<T> = this.NULL;
    while (node !== this.NULL) {
      if (node.val.isEqual(key)) {
        z = node;
      }

      if (node.val.lessThan(key) || node.val.isEqual(key)) {
        node = node.left;
      } else {
        node = node.right;
      }
    }

    if (z === this.NULL) {
      console.log("Value not present in Tree !!");
      return;
    }

    let y = z;
    let yOriginalcolour = y.colour;
    let x: rbNode<T>;

    if (z.left === this.NULL) {
      x = z.right!;
      this.transplant(z, z.right!);
    } else if (z.right === this.NULL) {
      x = z.left!;
      this.transplant(z, z.left!);
    } else {
      y = this.minimum(z.right!);
      yOriginalcolour = y.colour;
      x = y.right!;

      if (y.parent === z) {
        x.parent = y;
      } else {
        this.transplant(y, y.right!);
        y.right = z.right;
        y.right.parent = y;
      }

      this.transplant(z, y);
      y.left = z.left;
      y.left.parent = y;
      y.colour = z.colour;
    }

    if (yOriginalcolour === 0) {
      this.fixDelete(x);
    }
  }

  deleterbNode(val: T): void {
    this.deleterbNodeHelper(this.root, val);
  }

  getNode(val: T): rbNode<T> {
    let current = this.root;

    while (current != null) {
      if (val.isEqual(current.val)) return current;
      else if (val.lessThan(current.val)) current = current.left;
      else current = current.right;
    }

    return null;
  }

  private printCall(node: rbNode<T> | null, indent: string, last: boolean): void {
    if (!node) return;

    const scolour = node.colour === 1 ? "RED" : "BLACK";
    if (node !== this.NULL) {
      if (last) {
        console.log(indent + "L----" + `${node.val}(${scolour})`)
        indent += "     ";
      } else {
        console.log(indent + "R----" + `${node.val}(${scolour})`)
        indent += "|    ";
      }

      this.printCall(node.left, indent, false);
      this.printCall(node.right, indent, true);
    }
  }

  printTree(): void {
    this.printCall(this.root, "", true);
  }
}