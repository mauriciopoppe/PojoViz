
let idCounter = 0;
export function uniqueId(prefix = '') {
  idCounter += 1;
  return prefix + idCounter;
}

export function template(str) {
  return function(data) {
    return str.replace(/\${(.*?)}/g, (match, key) => {
        const keys = key.trim().split('.');
        let value = data;
        for(const k of keys) {
            if (value === undefined) break;
            value = value[k];
        }
        return value !== undefined ? value : '';
    });
  }
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

export function deepMerge(target, ...sources) {
    if (!sources.length) {
        return target;
    }
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) {
                    Object.assign(target, { [key]: {} });
                }
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  if (obj instanceof Object) {
    const clone = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = deepClone(obj[key]);
      }
    }
    return clone;
  }
  return obj;
}
