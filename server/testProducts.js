fetch('http://localhost:5000/api/products')
  .then(r => r.json())
  .then(d => {
    console.log(d.data.map(p => p.name));
  });
