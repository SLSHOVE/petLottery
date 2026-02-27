import React from 'react';
import DataContext from './dataContext'
export default function withData (Component) {
  return function DataComponent(props) {
    return (
      <DataContext.Consumer>
        { data => <Component {...data} {...props} />}
      </DataContext.Consumer>
    )
  }
}