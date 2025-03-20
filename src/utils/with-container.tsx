// import { observer } from "mobx-react-lite"
// import * as React from "react"
// import { Container } from "unstated-next"

// interface WithContainerOptions {
//   hasRef?: boolean
// }

// function withContainer<T, S>(
//   container: Container<T, S>,
//   options?: WithContainerOptions
// ) {
//   return (
//     Component:
//       | React.ComponentType<any>
//       | React.ForwardRefRenderFunction<any, any>
//   ) => {
//     const Observer = observer(Component)
//     const { hasRef } = options ?? {}

//     const WrappedComponent = hasRef
//       ? React.forwardRef((props: React.ComponentProps<any>, ref) => (
//           <container.Provider initialState={props}>
//             <Observer {...props} ref={ref} />
//           </container.Provider>
//         ))
//       : (props: React.ComponentProps<any>) => (
//           <container.Provider initialState={props}>
//             <Observer {...props} />
//           </container.Provider>
//         )

//     const displayName = Component.displayName || Component.name || "Component"
//     WrappedComponent.displayName = `withContainer(${displayName})`

//     return WrappedComponent as React.FC<React.ComponentProps<any>>
//   }
// }

// export default withContainer
