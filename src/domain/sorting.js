// sorting.js

// Core Merge Sort algorithm
export function mergeSort(array, compareFn) {
    // Base case: arrays with 0 or 1 elements don't need sorting
    if (array.length <= 1) {
        return array;
    }

    // Split the array in half
    const middle = Math.floor(array.length / 2);
    const left = array.slice(0, middle);
    const right = array.slice(middle);

    // Recursively sort both halves, then merge them back together
    return merge(
        mergeSort(left, compareFn),
        mergeSort(right, compareFn),
        compareFn
    );
}

// Helper function to combine two sorted halves
function merge(left, right, compareFn) {
    let resultArray = [], leftIndex = 0, rightIndex = 0;

    // Compare elements from left and right arrays and push the smaller one
    while (leftIndex < left.length && rightIndex < right.length) {
        if (compareFn(left[leftIndex], right[rightIndex]) <= 0) {
            resultArray.push(left[leftIndex]);
            leftIndex++;
        } else {
            resultArray.push(right[rightIndex]);
            rightIndex++;
        }
    }

    // Concatenate any remaining elements
    return resultArray
        .concat(left.slice(leftIndex))
        .concat(right.slice(rightIndex));
}
