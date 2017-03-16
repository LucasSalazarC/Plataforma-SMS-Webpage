using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;
using ContAdminServ_V3;
using ContAdminServ_V3.Models;
using System.Web.Http.Cors;

namespace ContAdminServ_V3.Controllers
{
    [EnableCors(origins: "http://localhost", headers: "*", methods: "*")]
    public class ProductosController : ApiController
    {
        private PeriodistasSMSEntities db = new PeriodistasSMSEntities();

        [HttpGet]
        public IHttpActionResult GetProdIdName()
        {
            var response = db.Producto.Select
                (p => new ProductoDTO()
                {
                    Id = p.Id,
                    Nombre = p.Nombre
                });

            return Ok(response);
        }

        [HttpGet]
        public IHttpActionResult GetOneProducto(int id)
        {
            var response = db.Producto.Select
                (p => new ProductoDTO()
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Atemporal = p.Atemporal
                }).Where(p => p.Id == id).FirstOrDefault();

            if(response == null)
            {
                return Content(HttpStatusCode.NotFound, "No se encontró el producto.");
            }
            else
            {
                return Ok(response);
            }
        }


        // Obtener lista de productos, con info adicional para mostrar en una tabla
        [HttpGet]
        public IHttpActionResult GetProductos()
        {
            var productos = db.Producto.Select
                (p => new ProductoDTO()
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Atemporal = p.Atemporal,
                    Categoria = new CategoriaDTO { Id = p.Categoria.Id, Nombre = p.Categoria.Nombre },
                    Contenido = p.Contenido.Select
                    (
                        c => new ContenidoDTO
                        {
                            Id = c.Id,
                            Enviado = c. Enviado,
                            FechaEnvio = c.FechaEnvio
                        }
                    )
                }).ToList();

            foreach (ProductoDTO p in productos) // Calcular días restantes
            {
                // Atemporal == true -> Mesajes no tienen fecha de envío
                if (p.Atemporal)
                {
                    p.DiasRestantes = p.Contenido.Count(c => c.Enviado == false);
                }
                // Atemporal == false -> Mesajes tienen fecha de envío
                else
                {
                    // Encontrar contenido correspondiente al día de mañana
                    DateTime day = DateTime.Now.Date.AddDays(1);
                    List<ContenidoDTO> contenidosProducto = p.Contenido.OrderBy(c => c.FechaEnvio).ToList();
                    int contIdx = contenidosProducto.FindIndex(c => c.FechaEnvio.Value.Date == day);

                    if (contIdx == -1)   // No se encontró, por lo tanto queda contenido para 0 días
                    {
                        p.DiasRestantes = 0;
                    }
                    else    // Hay por lo menos para 1 día
                    {
                        int daysRemaining = 1;
                        DateTime tempDate;

                        // Iterar día por día, hasta encontrar una fecha que no tenga contenido, llevando la cuenta
                        while (contIdx + 1 < contenidosProducto.Count)
                        {
                            tempDate = contenidosProducto[contIdx].FechaEnvio.Value.Date;
                            while(contIdx + 1 < contenidosProducto.Count 
                                    && contenidosProducto[contIdx].FechaEnvio.Value.Date == tempDate)
                            {
                                contIdx++;
                            }

                            day = day.AddDays(1);

                            if (day == contenidosProducto[contIdx].FechaEnvio.Value.Date)
                            {
                                daysRemaining++;
                            }
                            else break;
                        } 

                        p.DiasRestantes = daysRemaining;
                    }
                }
            }

            return Ok(productos);
        }
        

        // PUT: api/Productos/5
        [ResponseType(typeof(void))]
        public IHttpActionResult PutProducto(int id, Producto producto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != producto.Id)
            {
                return BadRequest();
            }

            db.Entry(producto).State = EntityState.Modified;

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductoExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return StatusCode(HttpStatusCode.NoContent);
        }

        // POST: api/Productos
        [ResponseType(typeof(Producto))]
        public IHttpActionResult PostProducto(Producto producto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            db.Producto.Add(producto);
            db.SaveChanges();

            return CreatedAtRoute("DefaultApi", new { id = producto.Id }, producto);
        }

        // DELETE: api/Productos/5
        [ResponseType(typeof(Producto))]
        public IHttpActionResult DeleteProducto(int id)
        {
            Producto producto = db.Producto.Find(id);
            if (producto == null)
            {
                return NotFound();
            }

            db.Producto.Remove(producto);
            db.SaveChanges();

            return Ok(producto);
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool ProductoExists(int id)
        {
            return db.Producto.Count(e => e.Id == id) > 0;
        }
    }
}