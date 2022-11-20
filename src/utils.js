// ! flags
export const NoFlags = /*                      */ 0b00000000000000000000;

// 新增、插入
export const Placement = /*                    */ 0b0000000000000000000010; // 2
// 节点更新属性
export const Update = /*                       */ 0b0000000000000000000100; // 4
// 删除
export const Deletion = /*                     */ 0b0000000000000000001000; // 8

// *******************************************
export const HookLayout = /*   */ 0b010
export const HookPassive = /*  */ 0b100
// *******************************************

export function isStr(s) {
    return typeof s === "string";
}

export function isStringOrNumber(s) {
    return typeof s === "string" || typeof s === "number";
}

export function isFn(fn) {
    return typeof fn === "function";
}

export function isArray(arr) {
    return Array.isArray(arr);
}

export function isUndefined(s) {
    return s === undefined;
}

// old props {className: 'red', id: '_id'}
// new props {className: 'green'}
export function updateNode(node, prevVal, nextVal) {
    Object.keys(prevVal)
        // .filter(k => k !== 'children')
        .forEach((k) => {
            if (k === 'children') {
                // 有可能是文本
                if (isStringOrNumber(prevVal[k])) {
                    node.textContent = ''
                }
            }
            else if (k.slice(0, 2) === 'on') {
                const eventName = k.slice(2).toLocaleLowerCase()
                node.removeEventListener(eventName, prevVal[k])
            }
            else {
                if (!(k in nextVal)) {
                    node[k] = ''
                }
            }
        })

    Object.keys(nextVal)
        .forEach((k) => {
            if (k === "children") {
                // 有可能是文本
                if (isStringOrNumber(nextVal[k])) {
                    node.textContent = nextVal[k] + ''
                }
            }
            // 简单粗暴的处理时间
            else if (k.slice(0, 2) === 'on') {
                // fake 事件
                const eventName = k.slice(2).toLocaleLowerCase()
                node.addEventListener(eventName, nextVal[k])
            }
            else {
                node[k] = nextVal[k];
            }
        });
}


// export function updateNode(node, nextVal) {
//     Object.keys(nextVal).forEach((k) => {
//         if (k === "children") {
//             if (isStringOrNumber(nextVal[k])) {
//                 node.textContent = nextVal[k];
//             }
//         }
//         // 简单粗暴的处理时间
//         else if (k.slice(0, 2) === 'on') {
//             // fake 事件
//             const eventName = k.slice(2).toLocaleLowerCase()
//             node.addEventListener(eventName, nextVal[k])
//         }
//         else {
//             node[k] = nextVal[k];
//         }
//     });
// }


/**
 * 依赖项浅比较
 * @param {*} nextDeps 当前值
 * @param {*} prevDeps 之前值
 */
export function aerHookInputsEqual(nextDeps, prevDeps) {
    if (prevDeps == null) {
        return false
    }

    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (Object.is(nextDeps[i], prevDeps[i])) {
            continue
        }

        return false
    }

    return true
}