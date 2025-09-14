import React from 'react';

export default class BaseModal extends React.Component {
  constructor(props) {
    super(props);
    this.domElement = React.createRef();
  }

  open() {
    if (this.domElement.current) {
      this.domElement.current.classList.add('active');
    }
  }

  close() {
    if (this.domElement.current) {
      this.domElement.current.classList.remove('active');
    }
  }

  render() {
    return (
      <div ref={this.domElement} className={`modal ${this.props.className || ''}`}>
        {this.props.children}
      </div>
    );
  }
}
