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
import { scheduleCallback } from "./scheduler";
import { Placement, Update, updateNode } from "./utils";

// work in progress 当前正在工作中的
let wip = null
let wipRoot = null

// 初始渲染和更新
export function scheduleUpdateOnFiber(fiber) {
    wip = fiber
    wipRoot = fiber

    scheduleCallback(workLoop)
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

function getParentNode(wip) {
    let tem = wip;

    while (tem) {
        if (tem.stateNode) {
            return tem.stateNode;
        }
        
        tem = tem.return;
    }
}

function commitWoeker(wip) {
    if (!wip) {
        return
    }
    // console.log('wip: ', wip)

    // 1. 提交自己
    // parentNode是父DOM节点
    // ?
    const parentNode = getParentNode(wip.return) //  wip.return.stateNode
    const {flags, stateNode} = wip

    if (flags & Placement && stateNode) {
        // 0 1 2 3 4
        // 2 1 3 4
        const before = getHostSibling(wip.sibling)
        insertOrAppendPlacementNode(stateNode, before, parentNode)

        // parentNode.appendChild(stateNode)
    }

    // 更新属性
    if (flags & Update && stateNode) {
        updateNode(stateNode, wip.alternate.props, wip.props)
    }

    // 删除节点
    if (wip.deletions) {
        // 删除wip的子节点
        commitDeletions(wip.deletions, stateNode || parentNode)
    }

    // 处理副作用
    if (wip.tag === FunctionComponent) {
        invokeHooks(wip)
    }

    // 2. 提交子节点
    commitWoeker(wip.child)

    // 3. 提交兄弟
    commitWoeker(wip.sibling)
}

// 提交
function commitRoot() {
    commitWoeker(wipRoot)

    // 因为会多次调用
    wipRoot = null
}

function workLoop() {
    while(wip) {
        performUnitWork()
    }

    if (!wip && wipRoot) {
        commitRoot()
    }
}

// function workLoop(IdleDeadline) {
//     while(wip && IdleDeadline.timeRemaining() > 0) {
//         performUnitWork()
//     }

//     if (!wip && wipRoot) {
//         commitRoot()
//     }
// }

// requestIdleCallback(workLoop)

/**
 * 
 * @param {*} deletions 需要删除节点的数组
 * @param {*} parentNode 父节点
 */
function commitDeletions(deletions, parentNode) {
    for (let i = 0; i < deletions.length; i++) {
        parentNode.removeChild(getStateNode(deletions[i]))
    }
}

// 不是每个fiber都有dom节点
function getStateNode(fiber) {
    let tem = fiber

    while(!tem.stateNode) {
        tem = tem.child
    }

    return tem.stateNode
}

/**
 * 获取下一个节点
 * @param {*} sibling 下一个节点
 */
function getHostSibling(sibling) {
    while(sibling) {
        if (sibling?.stateNode && !(sibling.flags & Placement)) {
            return sibling.stateNode
        }

        sibling = sibling.sibling
    }

    return null
}

/**
 * 之前插入还是之后插入
 * @param {*} stateNode dom节点
 * @param {*} before 插入的位置节点
 * @param {*} parentNode 父节点
 */
function insertOrAppendPlacementNode(stateNode, before, parentNode) {
    if (before) {
        parentNode.insertBefore(stateNode, before)
    }
    else {
        parentNode.appendChild(stateNode)
    }
}

/**
 * 处理副作用
 * @param {*} wip fiber
 */
function invokeHooks(wip) {
    const {
        updateQueueOfEffect,
        updateQueueOfLayout
    } = wip

    // 同步
    for (let i = 0; i < updateQueueOfLayout.length; i++) {
        const effect = updateQueueOfLayout[i]
        effect.create()
    }

    // 异步
    for (let i = 0; i < updateQueueOfEffect.length; i++) {
        const effect = updateQueueOfEffect[i]

        scheduleCallback(() => {
            effect.create()
        })
    }
}