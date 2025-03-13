import { observer } from "mobx-react-lite"
// import type { IReactComponent } from "mobx-react-lite"
import * as React from "react"
import { Container } from "unstated-next"

function withContainer<T, S>(
  container: Container<T, S>,
  options?: {
    hasRef?: boolean
  }
) {
  return (component: any) => {
    const Observer: any = observer(component)
    const { hasRef } = options ?? {}
    if (hasRef) {
      return React.forwardRef((props: React.ComponentProps<any>, ref) => (
        <container.Provider initialState={props}>
          <Observer {...props} ref={ref} />
        </container.Provider>
      )) as React.FC<React.ComponentProps<any>>
    }

    return (props: React.ComponentProps<any>) => (
      <container.Provider initialState={props}>
        <Observer {...props} />
      </container.Provider>
    )
  }
}

export default withContainer
