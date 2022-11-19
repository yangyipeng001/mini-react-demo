import { createFiber } from "./ReactFiber"
import { isArray, isStringOrNumber, Placement, Update } from "./utils"

// 节点复用的条件：1.同一层级下 2.key相同 3.类型相同
function sameNode(a, b) {
    return a && b && a.key === b.key && a.type === b.type
}

/**
 * 删除节点
 * @param {*} returnFiber 父fiber
 * @param {*} childToDelete 当前删除的fiber
 * 
 * returnFiber.deletions = [a, b, c]
 */
 function deleteChild(returnFiber, childToDelete) {
    const deletions = returnFiber.deletions

    if (deletions) {
        returnFiber.deletions.push(childToDelete)
    }
    else {
        returnFiber.deletions = [childToDelete]
    }
}

/**
 * 删除多个节点
 * @param {*} returnFiber 父fiber
 * @param {*} currentFirstChild 当前链表头结点
 */
function deleteRemainingChildren(returnFiber, currentFirstChild) {
    let childToDelete = currentFirstChild

    while(childToDelete) {
        deleteChild(returnFiber, childToDelete)
        childToDelete = childToDelete.sibling
    }
}

/**
 * 插入子节点
 * 初次渲染：只是记录一下下标
 * 更新：检查节点是否移动
 * @param {*} newFiber 新fiber
 * @param {*} lastPlacedIndex // 上一次dom节点插入的最远位置
 * @param {*} newIndex 下标
 * @param {*} shouldTrackSideEffects 是否初次渲染
 */
function placeChild(
    newFiber,
    lastPlacedIndex,
    newIndex,
    shouldTrackSideEffects
) {
    newFiber.index = newIndex

    // 父节点初次渲染
    if (!shouldTrackSideEffects) {
        return lastPlacedIndex
    }

    // 父节点更新
    // 子节点是初次渲染还是更新呢
    const current = newFiber.alternate
    if (current) {
        const oldIndex = current.index
        // 子节点是更新
        // ! lastPlacedIndex 记录了上次dom节点的相对更新节点的最远位置
        // old 0 1 2 3 4
        // new 2 1 3 4
        // 2 1(6) 3 4 
        if (oldIndex < lastPlacedIndex) {
            // move
            newFiber.flags |= Placement
            return lastPlacedIndex
        }
        else {
            return oldIndex
        }
    }
    else {
        // 子节点是初次渲染
        newFiber.flags |= Placement
        return lastPlacedIndex
    }
}

/**
 * 构建哈希表
 * @param {*} currentFirstChild 当前fiber
 */
function mapRemainingChildren(currentFirstChild) {
    const existingChildren = new Map()
    let existingChild = currentFirstChild

    while(existingChild) {
        // key: value
        // key || index: fiber
        existingChildren.set(
            existingChild.key || existingChild.index,
            existingChild
        )

        existingChild = existingChild.sibling
    }

    return existingChildren
}

/**
 * 协调（diff)
 * @param {*} returnFiber 父fiber
 * @param {*} children 子节点
 * @returns 
 *
 * abc
 * bc
 */
export function reconcileChildren(returnFiber, children) {
    if (isStringOrNumber(children)) {
        return
    }

    // ! 简单的都处理成数组（源码多个节点是数组，单个节点是对象）
    const newChildren = isArray(children) ? children : [children]
    // oldFiber的头结点
    let oldFiber = returnFiber.alternate?.child
    // 下一个oldFiber | 暂时缓存下一个oldFiber
    let nextOldFiber = null
    // 用于判断是returnFiber初次渲染还是更新
    let shouldTrackSideEffects = !!returnFiber.alternate
    let previousNewFiber = null
    let newIndex = 0

    // 上一次dom节点插入的最远位置
    // old 0 1 2 3 4
    // new 2 1 3 4
    let lastPlacedIndex = 0

    // *1. 从左边往右遍历，比较新老节点，如果节点可以复用，继续往右，否则就停止
    for (; oldFiber && newIndex < newChildren.length; newIndex++) {
        const newChild = newChildren[newIndex]

        if (newChild === null) {
            continue
        }

        // 新节点遍历完了，老节点还有
        if (oldFiber.index > newIndex) {
            nextOldFiber = oldFiber
            oldFiber = null
        }
        else {
            nextOldFiber = oldFiber.sibling
        }

        const same = sameNode(newChild, oldFiber)
        // 不能复用
        if (!same) {
            if (oldFiber === null) {
                oldFiber = nextOldFiber
            }

            break
        }

        const newFiber = createFiber(newChild, returnFiber)

        // 可以复用
        Object.assign(newFiber, {
            stateNode: oldFiber.stateNode,
            alternate: oldFiber,
            flags: Update
        })

        // 节点更新
        lastPlacedIndex = placeChild(
            newFiber,
            lastPlacedIndex,
            newIndex,
            shouldTrackSideEffects
        )

        if (previousNewFiber === null) {
            // head node
            returnFiber.child = newFiber
        }
        else {
            previousNewFiber.sibling = newFiber
        }

        previousNewFiber = newFiber
        oldFiber = nextOldFiber
    }

    // *2. 新节点没了，老节点还有
    // 如果新节点遍历完了，但是（多个）老节点还有，（多个）老节点要被删除
    // 0 1 2
    // 0
    if (newIndex === newChildren.length) {
        deleteRemainingChildren(returnFiber, oldFiber)
        return
    }

    // *3.初次渲染
    // 1) 初次渲染
    // 2) 老节点没了，新节点还有
    if (!oldFiber) {
        for (; newIndex < newChildren.length; newIndex++) {
            const newChild = newChildren[newIndex]

            if (newChild === null) {
                continue
            }

            const newFiber = createFiber(newChild, returnFiber)

            lastPlacedIndex = placeChild(
                newFiber,
                lastPlacedIndex,
                newIndex,
                shouldTrackSideEffects
            )

            if (previousNewFiber === null) {
                // head node
                returnFiber.child = newFiber
            }
            else {
                previousNewFiber.sibling = newFiber
            }

            previousNewFiber = newFiber
        }
    }

    // *4. 新老节点都还有
    // 小而乱
    // old 0 1 [2 3 4]
    // new 0 1 [3 4]
    // !4.1 把剩下的old单链表构建哈希表
    const existingChildren = mapRemainingChildren(oldFiber)

    // !4.2 遍历新节点，通过新节点的key去哈希表中查找节点，找到就复用节点，并且删除哈希表中对应的节点
    for (; oldFiber && newIndex < newChildren.length; newIndex++) {
        const newChild = newChildren[newIndex]

        if (newChild === null) {
            continue
        }

        const newFiber = createFiber(newChild, returnFiber)
        // oldFiber
        const matchedFiber = existingChildren.get(newFiber.key || newFiber.index)

        // 节点复用
        if (matchedFiber) {
            Object.assign(newFiber, {
                stateNode: matchedFiber.stateNode,
                alternate: matchedFiber,
                flags: Update,
            })

            existingChildren.delete(newFiber.key || newFiber.index)
        }

        lastPlacedIndex = placeChild(
            newFiber,
            lastPlacedIndex,
            newIndex,
            shouldTrackSideEffects
        )

        if (previousNewFiber === null) {
            // head node
            returnFiber.child = newFiber
        }
        else {
            previousNewFiber.sibling = newFiber
        }

        previousNewFiber = newFiber
    }

    // *5. old的哈希表中还有值，遍历哈希表删除所有的old
    if (shouldTrackSideEffects) {
        existingChildren.forEach((child) => deleteChild(returnFiber, child))
    }

    // for (newIndex = 0; newIndex < newChildren.length; newIndex++) {
    //     const newChild = newChildren[newIndex]

    //     if (newChild === null) {
    //         continue
    //     }

    //     const newFiber = createFiber(newChild, returnFiber)
    //     const same = sameNode(newFiber, oldFiber)

    //     // 节点可以复用
    //     if (same) {
    //         Object.assign(newFiber, {
    //             stateNode: oldFiber.stateNode,
    //             alternate: oldFiber,
    //             flags: Update,
    //         })
    //     }

    //     // 节点不可以复用 && oldFiber存在
    //     if (!same && oldFiber) {
    //         deleteChild(returnFiber, oldFiber)
    //     }

    //     // oldfiber 向下移动 
    //     if (oldFiber) {
    //         oldFiber = oldFiber.sibling
    //     }

    //     if (previousNewFiber === null) {
    //         // head node
    //         returnFiber.child = newFiber
    //     }
    //     else {
    //         previousNewFiber.sibling = newFiber
    //     }

    //     previousNewFiber = newFiber
    // }
}