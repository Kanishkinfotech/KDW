fetch('http://localhost:5000/api/bundles')
  .then(r => r.json())
  .then(d => {
    console.log(d.data[0].products[0]);
  });
