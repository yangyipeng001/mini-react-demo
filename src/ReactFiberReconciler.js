import { renderWithHooks } from "./hooks"
import { reconcileChildren } from "./ReactChildFiber"
import { updateNode } from "./utils"

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