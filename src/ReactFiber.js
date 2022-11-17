import { FunctionComponent, HostComponent } from "./ReactWorkTags"
import { isFn, isStr, Placement } from "./utils"

export function createFiber(vnode, returnFiber) {
    const fiber = {
        // 类型
        type: vnode.type,
        key: vnode.key,
        // 属性
        props: vnode.props,
        // 不同类型的组件，stateNode也不同
        // 原生标签：dom节点
        // class：实例
        stateNode: null,

        // 第一个子fiber
        child: null,
        // 下一个兄弟节点
        sibling: null,
        // 父节点
        return: returnFiber,
        flags: Placement,

        // 记录节点在当前层级下的位置
        index: null,
    }

    const {type} = vnode

    if (isStr(type)) {
        fiber.tag = HostComponent
    }
    else if (isFn(type)) {
        // todo 函数以及类组件
        fiber.tag = FunctionComponent
    }

    return fiber
};
