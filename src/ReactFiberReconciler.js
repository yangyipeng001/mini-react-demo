import { createFiber } from "./ReactFiber"
import { isArray, isStringOrNumber, updateNode } from "./utils"

// 协调（diff)
function reconcileChildren(wip, children) {
    if (isStringOrNumber(children)) {
        return
    }

    // ! 简单的都处理成数组（源码多个节点是数组，单个节点是对象）
    const newChildren = isArray(children) ? children : [children]
    let previousNewFiber = null
    for (let i = 0; i < newChildren.length; i++) {
        const newChild = newChildren[i]

        if (newChild === null) {
            continue
        }

        const newFiber = createFiber(newChild, wip)

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

// 原生标签
export function updateHostComponent(wip) {
    if (!wip.stateNode) {
        // 创建标签
        wip.stateNode = document.createElement(wip.type)
        // 添加属性
        updateNode(wip.stateNode, wip.props)
    }

    // 渲染子节点
    reconcileChildren(wip, wip.props.children)
}

export function updateFunctionComponent() {}

export function updateClassComponent() {}

export function updateFragmentComponent() {}

export function updateHostTextComponent() {}