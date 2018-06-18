/**
 * Describes a method invocation that is processed by an interceptor-chain.
 * @see MethodInterceptor
 */
export interface IInvocation {
    /**
     * The object that was <b>originally</b> invoked.
     * Unlike <i>IInvocation.this</i>, <i>IInvocation.target</i> can <b>not</b>
     * be changed by the interceptor-chain.
     * Note also that this is the proxy-version of the invoked object.
     */
    readonly target: any;
    /**
     * The name of the method that was invoked. This cannot
     * be changed by the interceptor-chain
     */
    readonly member: string;

    readonly persistentContext: any;

    /**
     * Arguments supplied with the method invocation.
     * This array can be replaced or modified by the interceptor-chain.
     */
    args: any[];
    /**
     * <i>this</i> context of the method invocation. This can be changed by the interceptor-chain.
     */
    this: any;
    /**
     * Invoke the next handler of this method or the original method if this is the
     * end of the chain.
     * @returns the result of the method invocation
     */
    next(): any;
}

/**
 * Describes a property access that is processed by an interceptor-chain.
 */
export interface IAccess {
    /**
     * The object on which the property originally was accessed.
     * Unlike <i>IInvocation.this</i>, <i>IInvocation.target</i> can <b>not</b>
     * be changed by the interceptor-chain.
     * Note also that this is the proxy-version of the invoked object.
     */
    readonly target: any;
    /**
     * The name of the property that was accessed. This cannot
     * be changed by the interceptor-chain.
     */
    readonly member: string;

    readonly persistentContext: any;

    /**
     * If this is a setter call, this denotes the value the property is to be set to.
     * If this is a getter call, the value is ignored.
     */
    value: any;
    /**
     * <i>true</i> if this is setter-call, <i>false</i> otherwise. This cannot be changed
     * by the interceptor-chain.
     */
    readonly setter: boolean;
    /**
     * <i>this</i> context of the property-access. This can be changed by the interceptor-chain.
     */
    this: any;
    /**
     * Invoke the next handler of this property-access or access the original property if this is the
     * end of the chain.
     * @returns the value of the property for getters, true/false for setters
     */
    next(): any;
}

/**
 * Interceptor for method invocations. It is used with the <i>@around</i>-decorator.
 * @param {IInvocation} invocation provide information about the invocation and allows the
 * interceptor to forward the call to the next handler.
 * @returns {any} The result of the method invocation
 * @example
 * ```ts
 *
 * invocation => {
 *   // Access and modify argument
 *   invocation.args = ["Modified", "Arguments"];
 *
 *   // Access and modify 'this'-context of the called method
 *   invocation.this = that;
 *
 *   // Delegate call
 *   let result: any = invocation.next();
 *
 *   // Modify result
 *   result += 1;
 *   return result;
 * }
 * ```
 * @see around
 * @see AfterInterceptor
 * @see BeforeInterceptor
 */
export type MethodInterceptor = (invocation: IInvocation) => any;

/**
 * Interceptor for property-access. It is used with the <i>access</i>-decorator.
 * @param {IAccess} access provide information about the property-access and allows the
 * interceptor to forward the call to the next handler.
 * @returns {any} For getters (access.setter === false), this is the value of the property,
 * for setters true or false
 * @example
 * ```ts
 *
 * access => {
 *   if(access.setter) {
 *     // Overwrite the value the property is to be set to
 *     access.value = "Hello"
 *     return access.next();
 *   }
 *   // getter
 *   let value = access.next();
 *
 *   // Modify result
 *   value += 1;
 *   return value;
 * }
 * ```
 * @see access
 * @see GetterInterceptor
 * @see SetterInterceptor
 */
export type AccessInterceptor = (access: IAccess) => any;

/**
 * Interceptor for a property getter. It is used with the <i>@getter</i>-decorator.
 * @param {any} value of the property. This is (the potentially modified) value of the
 * property.
 * @returns {any} Modified value of the property.
 * @example
 * ```ts
 *
 * value => {
 *   // Modify result
 *   value += 1;
 *   return value;
 * }
 * ```
 * @see getter
 * @see AccessInterceptor
 */
export type GetterInterceptor = (value: any) => any;

/**
 * Interceptor for a property setter. It is used with the <i>@setter</i>-decorator.
 * @param {any} value to be assigned to the property (this has potentially already been
 * modified by previous interceptor)
 * @returns {any} Modified value to be assigned to the property.
 * @example
 * ```ts
 *
 * value => {
 *   // Modify assigned value
 *   value += 1;
 *   return value;
 * }
 * ```
 * @see setter
 * @see AccessInterceptor
 */
export type SetterInterceptor = (value: any) => any;

/**
 * Interceptor that is invoked after a invocation has completed. It is used
 * with the <i>@after</i>-decorator.
 * @param {any} result of the invocation
 * @returns {any} Modified result of the invocation
 * @example
 * ```ts
 *
 * result => {
 *   // Modify method result
 *   result += 1;
 *   return result;
 * }
 * ```
 * @see after
 * @see MethodInterceptor
 */
export type AfterInterceptor = (result: any) => any;

/**
 * Interceptor that is invoked before a method invocation. It is used
 * with the <i>@before</i>-decorator.
 * @param {any[]} args Arguments of the method invocation
 * @returns {any[]} Modified arguments
 * @example
 * ```ts
 *
 * args => {
 *   // Modify method arguments
 *   args.push("Additional argument");
 *   // Or swap them
 *   return ["Replacement", "Argument"];
 * }
 * ```
 * @see after
 * @see MethodInterceptor
 */
export type BeforeInterceptor = (args: any[]) => any[];

// *** Internal Data-Structures ***
/**
 * @hidden
 */
class Override {
    public methodInterceptors: MethodInterceptor[] = [];
    public accessInterceptors: AccessInterceptor[] = [];
}
/**
 * @hidden
 */
type ProxyData = Map < string, Override > ;
/**
 * @hidden
 */
const metaKey: string = "proxy-data";
/**
 * @hidden
 */
function createOverrideOnMember(targetClass: any, member: string): Override {
    let data: ProxyData = Reflect.getMetadata(metaKey, targetClass);
    if (!data) {
        Reflect.defineMetadata(metaKey, data = new Map(), targetClass);
    }
    let override = data.get(member);
    if (!override) {
        // If descriptor is supplied, this is a MethodDecorator, otherwise
        // it is a PropertyDecorator
        data.set(member, override = new Override());
    }
    return override;
}

/**
 * Root decorator for classes. This is <b>required</b> on classes that use interceptors.
 *
 * @see around
 * @see after
 * @see before
 * @see access
 * @see getter
 * @see setter
 * @example
 * ```ts
 *
 * args => {
 *   // Modify method arguments
 *   args.push("Additional argument");
 *   // Or swap them
 *   return ["Replacement", "Argument"];
 * }
 * ```
 */
export function proxy() {
    return (targetClass: any): any => {
        const data: ProxyData = Reflect.getMetadata(metaKey, targetClass);
        // If no overrides were set for this class,
        // return the unmodified constructor
        if (!data) {
            return targetClass;
        }
        // Return a new constructor for the class that delegates to the original,
        // then wraps the newly created object into a proxy.
        return function () {
            // Create and remember a raw version of the object
            const unproxied = new targetClass(...arguments);
            const interceptorContext = {};
            // Create and remember the proxy around the object
            const proxyInstance = new Proxy(unproxied, {
                // Getter override
                get < T > (target: T, p: PropertyKey, receiver: any): any {
                    const override = data.get(p.toString());
                    if (!override) {
                        return unproxied[p];
                    }
                    const name: string = p.toString();
                    // We start with the last interceptor
                    // (This is the outer-most one)
                    let accessInterceptor = override.accessInterceptors.length;
                    const propertyAccess: IAccess = {
                        get target() {
                            return target;
                        },
                        this: target,
                        get member() {
                            return name;
                        },
                        get setter() {
                            return false;
                        },
                        get persistentContext() {
                            return interceptorContext;
                        },
                        value: undefined,
                        next() {
                            // There is more interceptors in the chain
                            if (accessInterceptor > 0) {
                                return override.accessInterceptors[--accessInterceptor]
                                    .call(interceptorContext, propertyAccess);
                            }

                            let invokee: any = propertyAccess.this;
                            if (target === invokee) { // Case 1
                                // The interceptor chain did <b>not</b> change the
                                // <i>this</i> context.
                                // => We need to use the unproxied version of the object
                                // to prevent an infinite loop
                                invokee = unproxied;
                            } // else => The interceptor chain did change the
                            // <i>this</i> context.
                            // We invoke on supplied (possibly proxied) <i>this</i> context.
                            // This is so possible interceptors of the swapped <i>this</i>
                            // are called
                            return invokee[name];
                        },
                    };
                    const accessResult = propertyAccess.next();
                    if (typeof accessResult !== "function") {
                        return accessResult;
                    }
                    return function () {
                        // We start with the last interceptor
                        // (This is the outer-most one)
                        let methodInterceptor = override.methodInterceptors.length;
                        const invocation: IInvocation = {
                            args: [],
                            get target() {
                                return target;
                            },
                            this: propertyAccess.this,
                            get member() {
                                return name;
                            },
                            get persistentContext() {
                                return interceptorContext;
                            },
                            next() {
                                // There is more interceptors in the chain
                                if (methodInterceptor > 0) {
                                    return override.methodInterceptors[--methodInterceptor]
                                        .call(interceptorContext, invocation);
                                }
                                // This is a method, invoke the original method
                                // on the current <i>this</i> context
                                return accessResult.apply(invocation.this, invocation.args);
                            },
                        };
                        // Copy the arguments into a proper array
                        for (const arg of arguments) {
                            invocation.args.push(arg);
                        }
                        // Start the chain
                        return invocation.next();
                    };
                },
                // Setter override
                set(target: any, p: PropertyKey, value: any, receiver: any): boolean {
                    const override = data.get(p.toString());
                    if (!override) {
                       unproxied[p] = value;
                       return true;
                    }
                    const name: string = p.toString();
                    // We start with the last interceptor
                    // (This is the outer-most one)
                    let accessInterceptor = override.accessInterceptors.length;
                    const propertyAccess: IAccess = {
                        get target() {
                            return target;
                        },
                        this: target,
                        get member() {
                            return name;
                        },
                        get setter() {
                            return true;
                        },
                        get persistentContext() {
                            return interceptorContext;
                        },
                        value,
                        next() {
                            // There is more interceptors in the chain
                            if (accessInterceptor > 0) {
                                return override.accessInterceptors[--accessInterceptor]
                                    .call(interceptorContext, propertyAccess);
                            }
                            let invokee: any = propertyAccess.this;
                            if (target === invokee) { // Case 1
                                // The interceptor chain did <b>not</b> change the
                                // <i>this</i> context.
                                // => We need to use the unproxied version of the object
                                // to prevent an infinite loop
                                invokee = unproxied;
                            } // else => The interceptor chain did change the
                            // <i>this</i> context.
                            // We invoke on supplied (possibly proxied) <i>this</i> context.
                            // This is so possible interceptors of the swapped <i>this</i>
                            // are called
                            invokee[name] = propertyAccess.value;
                            return true;
                        },
                    };
                    return !!propertyAccess.next();
                },
            });
            return proxyInstance;
        };
    };
}

/**
 * Decorator for intercepting a method.
 * @param {MethodInterceptor[]} interceptors To apply to this method or property
 * @see MethodInterceptor
 */

export function around(...interceptors: MethodInterceptor[]): MethodDecorator & PropertyDecorator {
    return function < T > (
        target: any,
        propertyKey: string | symbol,
        descriptor ?: TypedPropertyDescriptor < T > ): void {
        createOverrideOnMember(target.constructor, propertyKey.toString()).methodInterceptors.push(...interceptors);
    };
}

/**
 * Decorator for intercepting a read/write property-access.
 * @param {AccessInterceptor[]} interceptors To apply to this method or property
 * @see AccessInterceptor
 */
export function access(...interceptors: AccessInterceptor[]): MethodDecorator & PropertyDecorator {
    return function < T > (
        target: any,
        propertyKey: string | symbol,
        descriptor ?: TypedPropertyDescriptor < T > ): void {
        createOverrideOnMember(target.constructor, propertyKey.toString()).accessInterceptors.push(...interceptors);
    };
}

/**
 * Decorator for intercepting after a method invocation.
 * @param {AfterInterceptor[]} interceptors To apply to this method or property
 * @see AfterInterceptor
 */
export function after(...interceptors: AfterInterceptor[]) {
    const aroundInterceptors: MethodInterceptor[] = [];
    for (const afterInterceptor of interceptors) {
        aroundInterceptors.push((invocation) => {
            return afterInterceptor(invocation.next());
        });
    }
    return around(...aroundInterceptors);
}

/**
 * Decorator for intercepting before a method invocation.
 * @param {BeforeInterceptor[]} interceptors To apply to this method or property
 * @see BeforeInterceptor
 */
export function before(...interceptors: BeforeInterceptor[]) {
    const aroundInterceptors: MethodInterceptor[] = [];
    for (const beforeInterceptor of interceptors) {
        aroundInterceptors.push((invocation) => {
            invocation.args = beforeInterceptor(invocation.args);
            return invocation.next();
        });
    }
    return around(...aroundInterceptors);
}

/**
 * Decorator for intercepting a property read-access.
 * @param {GetterInterceptor[]} interceptors To apply to this method or property
 * @see GetterInterceptor
 */
export function getter(...interceptors: GetterInterceptor[]) {
    const accessInterceptors: AccessInterceptor[] = [];
    for (const getterInterceptor of interceptors) {
        accessInterceptors.push((acc) => {
            if (acc.setter) {
                return acc.next();
            }
            return getterInterceptor(acc.next());
        });
    }
    return access(...accessInterceptors);
}

/**
 * Decorator for intercepting a property write-access.
 * @param {SetterInterceptor[]} interceptors To apply to this method or property
 * @see SetterInterceptor
 */
export function setter(...interceptors: SetterInterceptor[]) {
    const accessInterceptors: AccessInterceptor[] = [];
    for (const setterInterceptor of interceptors) {
        accessInterceptors.push((acc) => {
            if (!acc.setter) {
                return acc.next();
            }
            acc.value = setterInterceptor(acc.value);
            return acc.next();
        });
    }
    return access(...accessInterceptors);
}
