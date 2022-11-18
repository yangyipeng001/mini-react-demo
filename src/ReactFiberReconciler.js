import { renderWithHooks } from "./hooks"
import { createFiber } from "./ReactFiber"
import { isArray, isStringOrNumber, Update, updateNode } from "./utils"

// 协调（diff)
// abc
// bc
function reconcileChildren(wip, children) {
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

        if (same) {
            Object.assign(newFiber, {
                stateNode: oldFiber.stateNode,
                alternate: oldFiber,
                flags: Update,
            })
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

// 节点复用的条件：1.同一层级下 2.key相同 3.类型相同
function sameNode(a, b) {
    return a && b && a.key === b.key && a.type === b.type
}

// 原生标签
export function updateHostComponent(wip) {
    if (!wip.stateNode) {
        // 创建标签
        wip.stateNode = document.createElement(wip.type)
        // 添加属性
        updateNode(wip.stateNode, {}, wip.props)
    }

    // 渲染子节点
    reconcileChildren(wip, wip.props.children)
}

export function updateFunctionComponent(wip) {
    renderWithHooks(wip)
    
    const {type, props} = wip
    const children = type(props)

    reconcileChildren(wip, children)
}

export function updateClassComponent(wip) {
    const {type, props} = wip
    const instance = new type(props)
    const children = instance.render()

    reconcileChildren(wip, children)

}

export function updateFragmentComponent(wip) {
    reconcileChildren(wip, wip.props.children)
}

export function updateHostTextComponent(wip) {
    wip.stateNode = document.createTextNode(wip.props.children)
}