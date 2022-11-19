import { createFiber } from "./ReactFiber"
import { isArray, isStringOrNumber, Update } from "./utils"

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
    let previousNewFiber = null
    let newIndex = 0

    for (newIndex = 0; newIndex < newChildren.length; newIndex++) {
        const newChild = newChildren[newIndex]

        if (newChild === null) {
            continue
        }

        const newFiber = createFiber(newChild, returnFiber)
        const same = sameNode(newFiber, oldFiber)

        // 节点可以复用
        if (same) {
            Object.assign(newFiber, {
                stateNode: oldFiber.stateNode,
                alternate: oldFiber,
                flags: Update,
            })
        }

        // 节点不可以复用 && oldFiber存在
        if (!same && oldFiber) {
            deleteChild(returnFiber, oldFiber)
        }

        // oldfiber 向下移动 
        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }

        if (previousNewFiber === null) {
            // head node
            returnFiber.child = newFiber
        }
        else {
            previousNewFiber.sibling = newFiber
        }

        previousNewFiber = newFiber
    }

    // 如果新节点遍历完了，但是（多个）老节点还有，（多个）老节点要被删除
    if (newIndex === newChildren.length) {
        deleteRemainingChildren(returnFiber, oldFiber)
    }
}