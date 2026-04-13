import React, { useEffect, useState } from 'react';

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  useEffect(() => {
    if (open) {
      setName(initialProduct?.name ?? '');
      setCategory(initialProduct?.category ?? '');
      setDescription(initialProduct?.description ?? '');
      setPrice(initialProduct?.price ?? '');
      setStock(initialProduct?.stock ?? '');
    }
  }, [open, initialProduct]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !category.trim() || !price || !stock) {
      alert('Заполните все поля');
      return;
    }
    onSubmit({
      id: initialProduct?.id,
      name,
      category,
      description,
      price: Number(price),
      stock: Number(stock),
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">
            {mode === 'edit' ? 'Редактировать' : 'Создать'} товар
          </div>
          <button className="iconBtn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <label>Название <input value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Категория <input value={category} onChange={(e) => setCategory(e.target.value)} /></label>
          <label>Описание <input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <label>Цена <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></label>
          <label>Количество <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}