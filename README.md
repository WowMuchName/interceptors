# Interceptors
[![Build Status](https://travis-ci.org/WowMuchName/interceptors.svg?branch=master)](https://travis-ci.org/WowMuchName/interceptors)

## About
Inspired by Java method-interceptors, this package provides decorators that add method- an property-access-interception to your Typescript projects.

## Requirements
Interceptors depend on ES6 and Reflect-Metadata. No other dependencies are required.

## Installation

### Npm
```
npm i reflect-metadata interceptors --save
```

## Usage
To use the interceptor the Reflect-Metadata polyfill is required **once** per project.

```ts
// Add the meta-data polyfill
import "reflect-metadata";
// Import the desired interceptors
import {proxy} from "interceptors";
```
Imports are omitted in the examples

### Method-Interception
Interceptors provides 3 decorators for intercepting method-calls *around*, *before*, *after*.
*around* surrounds the original method, *before* allows argument modification, *after* allows
return value modification. You can do anything using *around* as the other decorators are based on
it. However it is also the most verbose way.

#### Arguments modification
Using <i>@around</i>:
```ts
@proxy()
class TestClass {
    @around(invocation => {
        invocation.args[0] = "(" + invocation.args[0] + ")";
        return invocation.next();
    })
    public say(sayWhat: string): void {
        console.log(sayWhat);
    }
}
new TestClass().say("Hello");
```
yields
```
(Hello)
```

Or shorter using <i>@before</i>:
```ts
@proxy()
class TestClass {
    @before(args => ["(" + args[0] + ")"])
    public say(sayWhat: string): void {
        console.log(sayWhat);
    }
}
```

#### Return value modification
Using <i>@around</i>:
```ts
@proxy()
class TestClass {
    @around(invocation => "(" + invocation.next() + ")")
    public getGreeting(): void {
        return "Hello";
    }
}
console.log(new TestClass().getGreeting());
```
yields
```
(Hello)
```

or shorter using <i>@after</i>

```ts
@proxy()
class TestClass {
    @after(result => "(" + result + ")")
    public getGreeting(): void {
        return "Hello";
    }
}
```

### Property-Access-Interception
Interceptors provides 3 decorators for intercepting property accesses *access*, *getter*, *setter*.
*access* surrounds the property access, *getter* is executed when a property is read and allows returning a modified value,
*setter* is executed when the property is assigned a value and allows modifying that value.
You can do anything using *access* as the other interceptors are based on it. However you need to distinguish between getter
and setter calls in that case.

#### Modifying a value
```ts
@proxy()
class TestClass {
    @access(acc => {
        if(acc.setter) {
            // The property is assigned
            if(!acc.value) {
                // If the use assigns undefined, revert to default
                acc.value = "Hello";
            }
            return acc.next();
        } // The property is accessed
        return "(" + acc.next() + ")";
    })
    public greeting?: string = "Hello";

    public say(): void {
        console.log(this.greeting);
    }
}

const test: TestClass = new TestClass();
test.greeting = "Hello World"
test.say();
test.greeting = undefined;
test.say();
```
Yields:
```
(Hello World)
(Hello)
```

### Advanced
A method that is about to be invoked is also a property. This means you can apply access- and method-interceptors.
```ts
@proxy()
class TestClass {
    @getter(value => (greeting: string) => console.log("[" + greeting + "]"))
    @before(args => ["(" + args[0] + ")"])
    public say(greeting: string): void {
        console.log(greeting);
    }
}

new TestClass().say("Hello");
```

```
[(Hello)]
```

### Context
All interceptors on an object share a persistent context. This object is unique for every instance of the class,
but persistent between access calls. All property-access- and method-interceptors share it.

```ts
@proxy()
class TestClass {
    @around(function(this: any, invocation){
        this.counter = this.counter ? this.counter + 1 : 1;
        invocation.args[0] = `Invocation ${this.counter}: ${invocation.args[0]}`
        return invocation.next();
    })
    public say(greeting: string): void {
        console.log(greeting);
    }
}
let test1: TestClass = new TestClass();
test1.say("Hello");
test1.say("Goodbye");
let test2: TestClass = new TestClass();
test2.say("Hello World");
```
Yields:
```
Invocation 1: Hello
Invocation 2: Goodbye
Invocation 1: Hello World
```

Alternatively

```ts
@proxy()
class TestClass {
    @around(invocation => {
        invocation.persistentContext.counter = invocation.persistentContext.counter ? 
            invocation.persistentContext.counter + 1 : 1;
        invocation.args[0] = 
            `Invocation ${invocation.persistentContext.counter}: ${invocation.args[0]}`
        return invocation.next();
    })
    public say(greeting: string): void {
        console.log(greeting);
    }
}
```



## Realistic examples
While the above examples show how to use the interceptors at the most basic level, in
reality you will want to wrap the functionality into your own decorator to achieve something
more useful.

### Logger interceptor
This examples demonstrates how to implement a basic logger interceptor.

```ts
// Logger interceptor
function log(logger: any) {
    return around(invocation => {
        let result: any = invocation.next();
        logger.log(`${invocation.member}(${invocation.args.join(", ")}) = ${result}`);
        return result;
    });
}

@proxy()
class TestClass {
    @log(console)
    public add(a: number, b: number): number {
        return a + b;
    }
}

new TestClass().add(1, 2);
```
Yields
```
add(1, 2) = 3
```

## More examples
Take a look at the test folder for additional usage examples.

## Api
Locally under <i>node_modules/interceptors/documentation/index.html</i> or 
[online](https://unpkg.com/interceptors@0.9.0/documentation/index.html)

## License

License under the MIT License (MIT)

Copyright © 2018 Mark Albert

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 

IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.