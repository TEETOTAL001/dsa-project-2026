// src/domain/waitlistQueue.js

class Node {
    constructor(value) {
        this.value = value;
        this.next = null;
    }
}

export class Queue {
    #head = null;
    #tail = null;
    #size = 0;

    // Add a person to the back of the line
    enqueue(value) {
        const newNode = new Node(value);
        if (this.#tail === null) {
            this.#head = newNode;
            this.#tail = newNode;
        } else {
            this.#tail.next = newNode;
            this.#tail = newNode;
        }
        this.#size++;
    }

    // Remove the first person from the front of the line
    dequeue() {
        if (this.#head === null) return null;
        
        const removedValue = this.#head.value;
        this.#head = this.#head.next;
        
        if (this.#head === null) {
            this.#tail = null;
        }
        this.#size--;
        return removedValue;
    }

    get size() {
        return this.#size;
    }

    // Turn the queue into an array so we can print it out easily
    toArray() {
        const result = [];
        let current = this.#head;
        while (current) {
            result.push(current.value);
            current = current.next;
        }
        return result;
    }
}
