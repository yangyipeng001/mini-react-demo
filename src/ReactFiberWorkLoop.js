import {
    updateClassComponent,
    updateFragmentComponent,
    updateFunctionComponent,
    updateHostComponent,
    updateHostTextComponent
} from "./ReactFiberReconciler";
import {
    ClassComponent,
    Fragment,
    FunctionComponent,
    HostComponent,
    HostText
} from "./ReactWorkTags";

// work in progress 当前正在工作中的
let wip = null
let wipRoot = null

// 初始渲染和更新
export function scheduleUpdateOnFiber(fiber) {
    wip = fiber
    wipRoot = fiber
}

function performUnitWork() {
    const {tag} = wip

    // todo 1. 更新当前组件
    switch(tag) {
        case HostComponent:
            updateHostComponent(wip)
            break

        case FunctionComponent:
            updateFunctionComponent(wip)
            break

        case ClassComponent:
            updateClassComponent(wip)
            break

        case Fragment:
            updateFragmentComponent(wip)
            break

        case HostText:
            updateHostTextComponent(wip)
            break

        default:
            break
    }

    // todo 2. 下一个更新谁 深度优先遍历 （国王的故事）
    if (wip.child) {
        wip = wip.child
        return
    }

    let next = wip
    
    // 如果没有兄弟，就去父级上找兄弟（也就是叔叔）
    while(next) {
        if (next.sibling) {
            wip = next.sibling
            return
        }

        next = next.return
    }

    wip = null
}