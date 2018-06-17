import "reflect-metadata";
import {
    assert,
} from "chai";
import "reflect-metadata";
import {
    IAccess,
    access,
    after,
    around,
    before,
    proxy,
    IInvocation,
    getter,
    setter,
} from "../lib/index";

@proxy()
class Greeter {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

let greeterMeta: IAccess;
let greeterMetaThis: any;
@proxy()
class GreeterMeta {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @access(function(this: any, access: IAccess) {
        greeterMeta = access;
        greeterMetaThis = this;
        return access.next();
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

let greeterSetterMeta: IAccess;
let greeterSetterMetaThis: any;
@proxy()
class GreeterSetterMeta {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @access(function(this: any, access: IAccess) {
        if(access.setter) {
            greeterSetterMeta = access;
            greeterSetterMetaThis = this;
        }
        return access.next();
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}


let greeterInvocationMeta: IInvocation;
let greeterInvocationMetaThis: any;
@proxy()
class GreeterMetaInvocation {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @around(function(this: any, access: IInvocation) {
        greeterInvocationMeta = access;
        greeterInvocationMetaThis = this;
        return access.next();
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

const greeterOrder: string[] = [];
@proxy()
class GreeterOrder {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @access((invocation) => {
        greeterOrder.push(`Before Property`);
        const x = invocation.next();
        greeterOrder.push(`After Property`);
        return x;
    })
    @around((invocation) => {
        greeterOrder.push(`Before Outer`);
        let x = invocation.next();
        greeterOrder.push(`After Outer`);
        return x;
    })
    @after((res) => {
        greeterOrder.push(`After`);
        return res;
    })
    @around((invocation) => {
        greeterOrder.push(`Before Inner`);
        let x = invocation.next();
        greeterOrder.push(`After Inner`);
        return x;
    })
    @before((args) => {
        greeterOrder.push(`Before`);
        return args;
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

@proxy()
class GreeterOverloadParams {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @around((invocation) => {
        invocation.args = ["HeLLo", "wOrLd"];
        return invocation.next();
    })
    @around((invocation) => {
        invocation.args.push("!!!");
        return invocation.next();
    })
    @around((invocation) => {
        invocation.args = [invocation.args.join(" ")];
        return invocation.next();
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

@proxy()
class GreeterOverloadParamsWithBefore {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @before((arg) => {
        return ["HeLLo", "wOrLd"];
    })
    @before((args) => {
        args.push("!!!");
        return args;
    })
    @before((args) => {
        return [args.join(" ")];
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

@proxy()
class GreeterOverloadReturn {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @around((invocation) => {
        return "{" + invocation.next() + "}";
    })
    @around((invocation) => {
        return "[" + invocation.next() + "]";
    })
    @around((invocation) => {
        return "(" + invocation.next() + ")";
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}
@proxy()
class GreeterOverloadReturnWithAfter {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @after((ret) => {
        return "{" + ret + "}";
    })
    @after((ret) => {
        return "[" + ret + "]";
    })
    @after((ret) => {
        return "(" + ret + ")";
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}


let theOtherGreeter = new Greeter();
theOtherGreeter.firstName = "Jane"

@proxy()
class GreeterOverloadThis {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @around((invocation) => {
        invocation.this = theOtherGreeter;
        return invocation.next();
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

@proxy()
class GreeterOverloadThis2 {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @access((access) => {
        access.this = theOtherGreeter;
        return access.target.greet;
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}
@proxy()
class GreeterOverloadThis3 {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @access((access) => {
        access.this = theOtherGreeter;
        return access.next();
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}
@proxy()
class GreeterOverloadAccessAndInvocation {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @access((access) => {
        access.this = theOtherGreeter;
        return function(this: Greeter, greeting: string) {
            return `${this.firstName} ${this.lastName} says: "${greeting}"`;
        };
    })
    @around(function(this: any, invocation){
        this.counter = this.counter ? this.counter + 1 : 1;
        return `Invocation ${this.counter}: ${invocation.next()}`;
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}



@proxy()
class GreeterInterceptorContextViaThis {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    @around(function(this: any, invocation){
        this.counter = this.counter ? this.counter + 1 : 1;
        return `Invocation ${this.counter}: ${invocation.next()}`;
    })
    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

@proxy()
class GreeterNoInterceptor {
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }

    @around(function(this: any, invocation){
        return "Error";
    })
    public greet2(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

@proxy()
class GreeterOverloadGetter {
    @access(function(this: any, access){
        return "Jane";
    })
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}

@proxy()
class GreeterOverloadGetterWithGetter {
    @getter(function(this: any, res){
        return "Jane";
    })
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}
@proxy()
class GreeterOverloadSetter {
    @access(function(this: any, access){
        if(access.setter) {
            access.value = "Jane";
        }
        return access.next();
    })
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}
@proxy()
class GreeterOverloadSetterWithSetter {
    @setter(function(this: any, value){
        return "Jane";
    })
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}
let setterTarget = new Greeter();
@proxy()
class GreeterOverloadSetterThis {
    @access(function(this: any, access){
        if(access.setter) {
            access.this = setterTarget;
        }
        return access.next();
    })
    public firstName: string = "Jon";
    public lastName: string = "Doe";

    public greet(greeting: string): string {
        return `${this.firstName} ${this.lastName}: "${greeting}"`;
    }
}


describe("Proxy", function () {
    it("should not override constructor unnecessarily", () => {
        // For now this is only verifiable by looking at the coverage
        assert.equal(new Greeter().greet("Hello World!"), 'Jon Doe: "Hello World!"');
    });
    it("should execute interceptors in the correct order", () => {
        assert.equal(new GreeterOrder().greet("Hello World!"), 'Jon Doe: "Hello World!"');
        assert.deepEqual(greeterOrder, ["Before Property",
            "After Property",
            "Before Outer",
            "Before Inner",
            "Before",
            "After Inner",
            "After",
            "After Outer",
        ]);
    });
});
describe("Method-Interceptors", function () {
    describe("around", function () {
        it("should be possible to swap or modify the parameters", () => {
            assert.equal(new GreeterOverloadParams().greet("Hello World!"), 'Jon Doe: "HeLLo wOrLd !!!"');
        });
        it("should be possible to override the return value", () => {
            assert.equal(new GreeterOverloadReturn().greet("Hello World!"), '{[(Jon Doe: "Hello World!")]}');
        });
        it("should be possible to override the this-context via around", () => {
            assert.equal(new GreeterOverloadThis().greet("Hello World!"), 'Jane Doe: "Hello World!"');
        });
        it("should be possible to override the this-context via access", () => {
            assert.equal(new GreeterOverloadThis2().greet("Hello World!"), 'Jane Doe: "Hello World!"');
            assert.equal(new GreeterOverloadThis3().greet("Hello World!"), 'Jane Doe: "Hello World!"');
        });
        it("Interceptors should have a shared persistent context", () => {
            let greeter = new GreeterInterceptorContextViaThis();
            assert.equal(greeter.greet("Hello World!"), 'Invocation 1: Jon Doe: "Hello World!"');
            assert.equal(greeter.greet("Goodbye"), 'Invocation 2: Jon Doe: "Goodbye"');
        });
        it("should have correct meta for invocation", () => {
            assert.equal(new GreeterMetaInvocation().greet("Hello World!"), 'Jon Doe: "Hello World!"');
            assert.isTrue(greeterInvocationMeta.persistentContext === greeterInvocationMetaThis);
            assert.isTrue(greeterInvocationMeta.target === greeterInvocationMeta.this);
            assert.equal(greeterInvocationMeta.member, "greet");
        });
    });
    describe("after", function () {
        it("should be possible to override the return value", () => {
            assert.equal(new GreeterOverloadReturnWithAfter().greet("Hello World!"), '{[(Jon Doe: "Hello World!")]}');
        });
    });
    describe("before", function () {
        it("should be possible to swap or modify the parameters", () => {
            assert.equal(new GreeterOverloadParamsWithBefore().greet("Hello World!"), 'Jon Doe: "HeLLo wOrLd !!!"');
        });
    });
});
describe("Access-Interceptors", function () {
    describe("access", function () {
        it("should have correct meta for access", () => {
            assert.equal(new GreeterMeta().greet("Hello World!"), 'Jon Doe: "Hello World!"');
            assert.equal(greeterMeta.member, "greet");
            assert.isTrue(greeterMeta.persistentContext === greeterMetaThis);
            assert.isTrue(greeterMeta.target === greeterMeta.this);
            assert.isTrue(!greeterMeta.setter);
        });
        it("should have correct meta for setter-access", () => {
            let greeter = new GreeterSetterMeta()
            let nuFunction = (message: string) => message;
            greeter.greet = nuFunction;
            assert.equal(greeter.greet("Hello World!"), "Hello World!");
            assert.isTrue(greeterSetterMeta.setter);
            assert.isTrue(greeterSetterMeta.persistentContext === greeterSetterMetaThis);
            assert.isTrue(greeterSetterMeta.target === greeterSetterMeta.this);
            assert.equal(greeterSetterMeta.value, nuFunction);
            assert.equal(greeterSetterMeta.member, "greet");
        });
        it("member-interceptors should only affect members they are applied to", () => {
            assert.equal(new GreeterNoInterceptor().greet("Hello World!"), 'Jon Doe: "Hello World!"');
            let greeter = new GreeterNoInterceptor();
            greeter.greet = () => "";
            assert.equal(greeter.greet("Hello World!"), "");
        });
        it("should be able to override getter", () => {
            assert.equal(new GreeterOverloadGetter().greet("Hello World!"), 'Jane Doe: "Hello World!"');
            assert.equal(new GreeterOverloadGetter().firstName, "Jane");
        });
        it("should be able to override a setter", () => {
            let greeter = new GreeterOverloadSetter();
            greeter.firstName = "Jim";
            assert.equal(greeter.firstName, "Jane");
        });
        it("should be able to override a setter target", () => {
            let greeter = new GreeterOverloadSetterThis();
            greeter.firstName = "Jane";
            assert.equal(setterTarget.firstName, "Jane");
            assert.equal(greeter.firstName, "Jon");
        });
        it("should be able to override access and invocation", () => {
            let greeter = new GreeterOverloadAccessAndInvocation();
            assert.equal(greeter.greet("Hello World!"), 'Invocation 1: Jane Doe says: "Hello World!"');
            assert.equal(greeter.greet("Goodbye"), 'Invocation 2: Jane Doe says: "Goodbye"');
        });
    });
    describe("getter", function () {
        it("should be able to override getter", () => {
            let greeter = new GreeterOverloadGetterWithGetter();
            greeter.firstName = "Jim";
            assert.equal(greeter.greet("Hello World!"), 'Jane Doe: "Hello World!"');
            assert.equal(greeter.firstName, "Jane");
        });
    });
    describe("setter", function () {
        it("should be able to override getter", () => {
            let greeter = new GreeterOverloadSetterWithSetter();
            greeter.firstName = "Jim";
            assert.equal(greeter.firstName, "Jane");
        });
    });
});