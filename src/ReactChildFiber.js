import { createFiber } from "./ReactFiber"
import { isArray, isStringOrNumber, Update } from "./utils"

// 节点复用的条件：1.同一层级下 2.key相同 3.类型相同
function sameNode(a, b) {
    return a && b && a.key === b.key && a.type === b.type
}

/**
 * 
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

// 协调（diff)
// abc
// bc
export function reconcileChildren(wip, children) {
    if (isStringOrNumber(children)) {
        return
    }

    // ! 简单的都处理成数组（源码多个节点是数组，单个节点是对象）
    const newChildren = isArray(children) ? children : [children]
    // oldFiber的头结点
    let oldFiber = wip.alternate?.child
    let previousNewFiber = null
    for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i]

        if (newChild === null) {
            continue
        }

        const newFiber = createFiber(newChild, wip)
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
            deleteChild(wip, oldFiber)
        }

        // oldfiber 向下移动 
        if (oldFiber) {
            oldFiber = oldFiber.sibling
        }

        if (previousNewFiber === null) {
            // head node
            wip.child = newFiber
        }
        else {
            previousNewFiber.sibling = newFiber
        }

        previousNewFiber = newFiber
    }
}