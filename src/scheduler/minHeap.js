// 返回最小堆顶元素
export function peek(heap) {
    return heap.length === 0 ? null : heap[0]
}

// 往最小堆中插入元素
// 1. 把node插入数组尾部
// 2. 往上调整最小堆
export function push(heap, node) {
    let index = heap.length
    heap.push(node)

    siftUp(heap, node, index)
}

// 向上调整
function siftUp(heap, node, i) {
    let index = i

    while(index > 0) {
        const parentIndex = (index - 1) >> 1
        const parent = heap[parentIndex]

        // parent > node, 不符合最小堆条件
        if (compare(parent, node) > 0) {
            heap[parentIndex] = node
            heap[index] = parent
            index = parentIndex
        }
        else {
            return
        }
    }
}

function compare(a, b) {
    const diff = a?.sortIndex - b?.sortIndex

    return diff !== 0 ? diff : a.id - b.id
}

// 删除堆顶元素
// 1. 最后一个元素覆盖对顶
// 2. 向下调整
export function pop(heap) {
    if (heap.length === 0) {
        return null
    }

    const first = heap[0]
    const last = heap.pop()

    if (first !== last) {
        heap[0] = last

        siftDown(heap, last, 0)
    }

    return first
}

// 向下调整
function siftDown(heap, node, i) {
    let index = i
    const len = heap.length
    const halfLen = len >> 1

    while(halfLen < len) {
        const leftIndex = (index + 1) * 2 -1
        const rightIndex = leftIndex + 1
        const left = heap[leftIndex]
        const right = heap[rightIndex]

        // left < node
        if (compare(left, node) < 0) {
            // left < node
            // ? left right
            if (rightIndex < len && compare(right, left) < 0) {
                heap[index] = right
                heap[rightIndex] = node
                index = rightIndex
            }
            else {
                // 没有right或者left < right
                // 交换left和right
                heap[index] = left
                heap[leftIndex] = node
                index = leftIndex
            }
        }
        else if (rightIndex < len && compare(right, node) < 0) {
            // right最小，交换right和parent
            heap[index] = right
            heap[rightIndex] = node
            index = rightIndex
        }
        // parent最小
        else {
            return
        }
    }
}