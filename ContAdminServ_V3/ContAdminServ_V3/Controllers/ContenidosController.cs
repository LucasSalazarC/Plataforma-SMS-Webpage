using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Data.Entity.Infrastructure;
using System.Linq;
using System.Linq.Expressions;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Description;
using ContAdminServ_V3;
using System.Web.Http.Cors;
using LinqKit;
using ContAdminServ_V3.Models;

namespace ContAdminServ_V3.Controllers
{
    [EnableCors(origins: "http://localhost", headers: "*", methods: "*")]
    public class ContenidosController : ApiController
    {
        private PeriodistasSMSEntities db = new PeriodistasSMSEntities();
        // this.Configuration.ProxyCreationEnabled = false;
        // this.Configuration.LazyLoadingEnabled = false;

        [HttpGet]
        public IHttpActionResult SearchContenidos([FromUri] ContenidoSearch searchFields)
        {
            // EL predicate builder permite armar una query de forma dinámica
            var predicate = PredicateBuilder.New<ContenidoDTO>(true);

            if (searchFields.Id.HasValue)
            {
                predicate.And(c => c.Id == searchFields.Id.Value);
            }
            if (searchFields.IdProductos != null)
            {
                // Las idds de productos vienen en un string separadas por comas
                var PIDCondition = PredicateBuilder.New<ContenidoDTO>(true);
                string[] Ids = searchFields.IdProductos.Split(',');

                foreach(string id in Ids)
                {
                    int intId = 0;
                    if(Int32.TryParse(id, out intId))
                    {
                        PIDCondition.Or(c => c.Producto.Any(p => p.Id == intId));
                    }
                }

                predicate.And(PIDCondition);
            }
            if (searchFields.NombreProducto != null)
            {
                predicate.And(c => c.Producto.Any(p => p.Nombre.Contains(searchFields.NombreProducto)));
            }
            if (searchFields.FechaFormateada != null)
            {
                // Separamos la fecha (que viene en un string) en año, mes y día
                int y = 0, m = 0, d = 0;
                if (Int32.TryParse(searchFields.FechaFormateada.Split('-')[0], out y))
                {
                    predicate.And(c => c.FechaEnvio.Value.Year == y);
                }
                if (Int32.TryParse(searchFields.FechaFormateada.Split('-')[1], out m))
                {
                    predicate.And(c => c.FechaEnvio.Value.Month == m);
                }
                if (Int32.TryParse(searchFields.FechaFormateada.Split('-')[2], out d))
                {
                    predicate.And(c => c.FechaEnvio.Value.Day == d);
                }
            }
            if (searchFields.Texto != null)
            {
                predicate.And(c => c.Texto.Contains(searchFields.Texto));
            }
            if (searchFields.Tag != null)
            {
                // Tags vienen separados por comas
                var tagCondition = PredicateBuilder.New<ContenidoDTO>(true);
                string[] tags = searchFields.Tag.Split(',');

                foreach(string tag in tags)
                {
                    string temp = tag;
                    tagCondition.Or(c => c.Tag.Contains(temp));
                }

                predicate.And(tagCondition);
            }


            var response = db.Contenido.Include(c => c.Producto).Select
                (c => new ContenidoDTO()
                { 
                    Id = c.Id,
                    Texto = c.Texto,
                    FechaEnvio = c.FechaEnvio,
                    Enviado = c.Enviado,
                    Tag = c.Tag,
                    Producto = c.Producto.Select(p => new ProductoDTO { Id = p.Id, Nombre = p.Nombre})
                }).AsExpandable().Where(predicate);

            return Ok(response);

        }

        [HttpGet]
        public IHttpActionResult GetContenidosDeProducto([FromUri] int id)
        {

            var response = db.Producto.Include(p => p.Contenido).Select
                (p => new 
                {
                    Id = p.Id,
                    Contenido = p.Contenido.Select
                    (
                        c => new
                        {
                            Id = c.Id,
                            Texto = c.Texto,
                            FechaEnvio = c.FechaEnvio,
                            Enviado = c.Enviado,
                            Tag = c.Tag,
                            Producto = c.Producto.Select(pd => new { Id = pd.Id })
                        }
                    )
                }).Where(p => p.Id == id).FirstOrDefault();

            if (response == null)
            {
                return Content(HttpStatusCode.NotFound, "No se encontró el producto.");
            }
            else
            {
                return Ok(response.Contenido);
            }
        }


        [HttpPut]
        public IHttpActionResult PutContenidos(ContenidoPUT contData)
        {
            // La clase 'ContenidoPUT' viene con 4 flags, que indican cuáles con las propiedades que deben actuali
            foreach (ContenidoDTO cont in contData.Contenidos)
            {
                if (cont.IdProductos == null || cont.IdProductos.Length == 0)
                {
                    return Content(HttpStatusCode.BadRequest, "Id de producto no válida.");
                }

                var contenido = new Contenido
                {
                    Id = cont.Id,
                    FechaEnvio = cont.FechaEnvio,
                    Texto = cont.Texto,
                    Tag = cont.Tag
                };

                db.Contenido.Attach(contenido);
                var entry = db.Entry(contenido);

                if (contData.FlagFecha) entry.Property(c => c.FechaEnvio).IsModified = true;
                if (contData.FlagTexto) entry.Property(c => c.Texto).IsModified = true;
                if (contData.FlagTag) entry.Property(c => c.Tag).IsModified = true;

                if(contData.FlagProductos)
                {
                    // Borrar las asociaciones existentes, y reemplazarlas por las nuevas
                    entry.Collection(c => c.Producto).Load();
                    contenido.Producto.Clear();

                    db.Configuration.AutoDetectChangesEnabled = false;
                    foreach (int prodId in cont.IdProductos)
                    {
                        var prod = db.Producto.Find(prodId);
                        contenido.Producto.Add(prod);
                    }
                    db.Configuration.AutoDetectChangesEnabled = true;
                }

            }

            try
            {
                db.SaveChanges();
            }
            catch(System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.EntityValidationErrors.FirstOrDefault().ValidationErrors.FirstOrDefault().ErrorMessage);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Content(HttpStatusCode.InternalServerError, "Error de concurrencia al actualizar los contenidos");
            }
            catch(DbUpdateException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.GetMessage());
            }

            return Content(HttpStatusCode.OK, "Contenidos editados correctamente");
        }


        [HttpPost]
        public IHttpActionResult PostContenido(ContenidoDTO inputData)
        {
            
            var contenido = new Contenido
            {
                Texto = inputData.Texto,
                FechaEnvio = inputData.FechaEnvio,
                Tag = inputData.Tag
            };

            for(int i = 0; i < inputData.IdProductos.Count(); i++)
            {
                var prod = new Producto { Id = inputData.IdProductos[i] };
                db.Producto.Attach(prod);

                prod.Contenido.Add(contenido);
            }

            try
            {
                db.SaveChanges();
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.EntityValidationErrors.FirstOrDefault().ValidationErrors.FirstOrDefault().ErrorMessage);
            }
            catch (DbUpdateException ex)
            {
                return Content(HttpStatusCode.Conflict, ex.InnerException.InnerException.Message);
            }

            return Content(HttpStatusCode.OK, "Contenido cargado correctamente");
        }


        [HttpPost]
        public IHttpActionResult PostManyContenidos(ContenidoDTO[] dataArray)
        {
            Dictionary<int, Producto> prodDict = new Dictionary<int, Producto>();

            foreach (ContenidoDTO inputData in dataArray)
            {
                var contenido = new Contenido
                {
                    Texto = inputData.Texto,
                    FechaEnvio = inputData.FechaEnvio,
                    Tag = inputData.Tag
                };

                for (int i = 0; i < inputData.IdProductos.Count(); i++)
                {
                    if (prodDict.ContainsKey(inputData.IdProductos[i]))
                    {
                        prodDict[inputData.IdProductos[i]].Contenido.Add(contenido);
                    }
                    else
                    {
                        var prod = new Producto { Id = inputData.IdProductos[i] };   
                        db.Producto.Attach(prod);

                        prod.Contenido.Add(contenido);
                        prodDict.Add(inputData.IdProductos[i], prod);
                    }
                }
            }

            try
            {
                db.SaveChanges();
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.InternalServerError, ex.EntityValidationErrors.FirstOrDefault().ValidationErrors.FirstOrDefault().ErrorMessage);
            }
            catch (DbUpdateException ex)
            {
                return Content(HttpStatusCode.Conflict, ex.InnerException.InnerException.Message);
            }

            return Content(HttpStatusCode.OK, "Contenido cargado correctamente");
        }


        // Las Ids de los contenidos a borrar vienen en un array en el cuerpo del post
        [HttpPost]
        public IHttpActionResult DeleteContenidos(ICollection<int> contIds)
        {
            int ok = 0, err = 0;

            foreach (int id in contIds)
            {
                db.Configuration.AutoDetectChangesEnabled = false;
                Contenido contenido = db.Contenido.Find(id);
                db.Configuration.AutoDetectChangesEnabled = true;

                if (contenido == null)
                {
                    err++;
                    continue;
                }

                db.Contenido.Remove(contenido);
                ok++;
            }

            try
            {
                db.SaveChanges();
            }
            catch (DbUpdateException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.GetMessage());
            }

            if (err == 0) return Content(HttpStatusCode.OK, "Contenidos borrados correctamente");
            else if (ok == 0)
            {
                return Content(HttpStatusCode.NotFound, "Error! No se encontraron los contenidos a borrar."
                                                        + " Puede que ya hayan sido borrados por alguien más.");
            }
            else
            {
                string response;
                if (err == 1)
                {
                    if (ok == 1)
                    {
                        response = ok + " contenido borrado correctamente, " + err +
                                  " no se encontró en la base de datos.";
                    }
                    else
                    {
                        response = ok + " contenidos borrados correctamente, " + err +
                                  " no se encontró en la base de datos.";
                    }
                }
                else
                {
                    if (ok == 1)
                    {
                        response = ok + " contenido borrado correctamente, " + err +
                                  " no se encontraron en la base de datos.";
                    }
                    else
                    {
                        response = ok + " contenidos borrados correctamente, " + err +
                                  " no se encontraron en la base de datos.";
                    }
                }

                return Content(HttpStatusCode.OK, response);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }

        private bool ContenidoExists(int id)
        {
            return db.Contenido.Count(e => e.Id == id) > 0;
        }
    }
}