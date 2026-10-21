// benchmark.js
import { generateReferenceCode } from './objects.js';

console.log("=== Starting Big O Performance Benchmark ===");
const targetRef = "REF-TARGET7";
const totalItems = 100000;

// 1. Setup an Array and a Map with 100,000 items
const bookingArray = [];
const bookingMap = new Map();

for (let i = 0; i < totalItems; i++) {
    const dummyRef = generateReferenceCode() + i;
    bookingArray.push({ referenceCode: dummyRef, status: 'CONFIRMED' });
    bookingMap.set(dummyRef, { referenceCode: dummyRef, status: 'CONFIRMED' });
}

// Insert our target lookup at the very end of the array to simulate a worst-case scenario
bookingArray.push({ referenceCode: targetRef, status: 'CONFIRMED' });
bookingMap.set(targetRef, { referenceCode: targetRef, status: 'CONFIRMED' });

// 2. Benchmark the Array (.find method)
console.time('Array.find Lookup (O(n))');
const arrayResult = bookingArray.find(b => b.referenceCode === targetRef);
console.timeEnd('Array.find Lookup (O(n))');

// 3. Benchmark the Map (.get method)
console.time('Map.get Lookup (O(1))');
const mapResult = bookingMap.get(targetRef);
console.timeEnd('Map.get Lookup (O(1))');

console.log("\n=== Benchmark Complete ===");
