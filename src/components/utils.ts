
export class DefaultDict {
    constructor(defaultInit: any) {
        return new Proxy({}, {
            get: (target: any, name) => name in target ?
            target[name] :
            (target[name] = typeof defaultInit === 'function' ?
            new defaultInit().valueOf() :
            defaultInit)
        })
    }
}

export function isObjectEmpty(obj: any) {
    for (const i in obj)
    return false;
    return true;
}

export function updateStartLocation(location: string, colOffset: number, lineOffset: number) {
    let loc = location.replace(/\)|\(/g, '').split(':')
    let [filepath, startLine, startCol, endLine, endCol] = loc
    let newStartCol = lineOffset === 0 ? parseInt(startCol, 10) + colOffset : colOffset
    return [filepath, (parseInt(startLine, 10)+lineOffset).toString(), newStartCol.toString(), endLine, endCol].join(':')
}

export function trimFilePath(location: string) {
    return location.replace(/\)|\(/g, '').replace('*file://', '').replace('file://', '')
}

export function getCoverageLabel(status: any, coverageType: string, fulfillOrReject: string) {
    if(status[coverageType][fulfillOrReject] === null) return '➖'
    else if(status[coverageType][fulfillOrReject] === true) return '✔️'
    else return '✖️'
}

export function objectFilter(obj: any, predicate: Function){
    return Object.keys(obj)
    .filter( key => predicate(obj[key]) )
    .reduce( (res, key) => Object.assign(res, { [key]: obj[key] }), {} );
} 

export function trimLabel(label: string): string {
    return label && label.length > 50 ? label.substr(0, 47) + '...' : label
}

export function findClosingBracketMatchIndex(str: string, pos: number, reverse=false) {
    let starting = reverse ? ')' : '('
    let ending = reverse ? '(' : ')'
    let step = reverse ? -1 : 1
    let endInd = reverse ? -1 : str.length
    if (str[pos] != starting) {
        throw new Error("No '" + starting + "' at index " + pos);
    }
    let depth = 1;
    for (let i = pos + step; i !== endInd; i += step) {
        switch (str[i]) {
            case starting:
            depth++;
            break;
            case ending:
            if (--depth == 0) {
                return i;
            }
            break;
        }
    }
    return -1;    // No matching closing parenthesis
}


export function compactStringify(passedObj: any, options: any = {}) {
    const stringOrChar = /("(?:[^\\"]|\\.)*")|[:,]/g;
    const indent = JSON.stringify(
      [1],
      undefined,
      options.indent === undefined ? 2 : options.indent
    ).slice(2, -3);
  
    const maxLength =
      indent === ""
        ? Infinity
        : options.maxLength === undefined
        ? 80
        : options.maxLength;
  
    let { replacer } = options;
  
    return (function _stringify(obj, currentIndent, reserved): any {
      if (obj && typeof obj.toJSON === "function") {
        obj = obj.toJSON();
      }
  
      const string = JSON.stringify(obj, replacer);
  
      if (string === undefined) {
        return string;
      }
  
      const length = maxLength - currentIndent.length - reserved;
  
      if (string.length <= length) {
        const prettified = string.replace(
          stringOrChar,
          (match, stringLiteral) => {
            return stringLiteral || `${match} `;
          }
        );
        if (prettified.length <= length) {
          return prettified;
        }
      }
  
      if (replacer != null) {
        obj = JSON.parse(string);
        replacer = undefined;
      }
  
      if (typeof obj === "object" && obj !== null) {
        const nextIndent = currentIndent + indent;
        const items = [];
        let index = 0;
        let start;
        let end;
  
        if (Array.isArray(obj)) {
          start = "[";
          end = "]";
          const { length } = obj;
          for (; index < length; index++) {
            items.push(
              _stringify(obj[index], nextIndent, index === length - 1 ? 0 : 1) ||
                "null"
            );
          }
        } else {
          start = "{";
          end = "}";
          const keys = Object.keys(obj);
          const { length } = keys;
          for (; index < length; index++) {
            const key = keys[index];
            const keyPart = `${JSON.stringify(key)}: `;
            const value: any = _stringify(
              obj[key],
              nextIndent,
              keyPart.length + (index === length - 1 ? 0 : 1)
            );
            if (value !== undefined) {
              items.push(keyPart + value);
            }
          }
        }
  
        if (items.length > 0) {
          return [start, indent + items.join(`,\n${nextIndent}`), end].join(
            `\n${currentIndent}`
          );
        }
      }
  
      return string;
    })(passedObj, "", 0);
  }

  export function capitalize(sentence: string) {
    return sentence.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
  }