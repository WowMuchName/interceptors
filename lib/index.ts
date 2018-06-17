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
 * Interceptor for method invocations and property accesses.
 * @param {Invocation} invocation provide information about the invocation and allows the
 * interceptor to forward the call to the next handler.
 * @returns {any} The result of the method invocation (invocation),
 * the property value (getter) or true/false (setter)
 */
export type MethodInterceptor = (invocation: IInvocation) => any;

export type AccessInterceptor = (access: IAccess) => any;

export type GetterInterceptor = (result: any) => any;

export type SetterInterceptor = (value: any) => any;

/**
 * Interceptor that is invoked after a invocation / access has completed.
 * @param {any} result Result of the invocation / value of the property
 * @returns {any} Modified result of the invocation / value of the property
 */
export type AfterInterceptor = (result: any) => any;
/**
 * Interceptor that is invoked before a invocation / access.
 * @param {any} args Arguments of the method invocation /
 * value to be assigned to a property (setter) / empty array (getter)
 * @returns {any} Modified arguments
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

export function around(...interceptors: MethodInterceptor[]): MethodDecorator & PropertyDecorator {
    return function < T > (
        target: any,
        propertyKey: string | symbol,
        descriptor ?: TypedPropertyDescriptor < T > ): void {
        createOverrideOnMember(target.constructor, propertyKey.toString()).methodInterceptors.push(...interceptors);
    };
}

export function access(...interceptors: AccessInterceptor[]): MethodDecorator & PropertyDecorator {
    return function < T > (
        target: any,
        propertyKey: string | symbol,
        descriptor ?: TypedPropertyDescriptor < T > ): void {
        createOverrideOnMember(target.constructor, propertyKey.toString()).accessInterceptors.push(...interceptors);
    };
}

export function after(...interceptors: AfterInterceptor[]) {
    const aroundInterceptors: MethodInterceptor[] = [];
    for (const afterInterceptor of interceptors) {
        aroundInterceptors.push((invocation) => {
            return afterInterceptor(invocation.next());
        });
    }
    return around(...aroundInterceptors);
}

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
