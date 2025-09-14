import React from 'react';

export default class SearchBlock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inputValue: ''
    };
  }

  handleInputChange = (e) => {
    this.setState({ inputValue: e.target.value });
  }

  handleReplace = () => {
    const { inputValue } = this.state;
    if (inputValue.trim()) {
      this.props.onReplace(inputValue.trim());
    }
  }

  handleAdd = () => {
    const { inputValue } = this.state;
    if (inputValue.trim()) {
      this.props.onAdd(inputValue.trim());
    }
  }

  render() {
    const { inputValue } = this.state;

    return (
      <div className="search-block">
        <h2 className="search-title">Резервное копирование изображений</h2>
        <div className="search-input-group">
          <input 
            type="text" 
            className="search-input" 
            placeholder="Введите id пользователя VK"
            value={inputValue}
            onChange={this.handleInputChange}
          />
          <button className="btn btn-primary" onClick={this.handleReplace}>
            <i className="fas fa-exchange-alt"></i> Заменить
          </button>
          <button className="btn btn-primary" onClick={this.handleAdd}>
            <i className="fas fa-plus"></i> Добавить
          </button>
        </div>
      </div>
    );
  }
}
