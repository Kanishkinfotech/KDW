fetch('http://localhost:5000/api/bundles')
  .then(r => r.json())
  .then(d => {
    console.log("Bundles returned:", d.data.length);
    if(d.data.length > 0) {
      console.log("Products in first bundle:", d.data[0].products?.length || 0);
    }
  });
