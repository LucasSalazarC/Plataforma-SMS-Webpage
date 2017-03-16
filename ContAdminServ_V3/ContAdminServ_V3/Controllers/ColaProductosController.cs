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
using System.Web.Http.Cors;
using ContAdminServ_V3.Models;

namespace ContAdminServ_V3.Controllers
{
    [EnableCors(origins: "http://localhost", headers: "*", methods: "*")]
    public class ColaProductosController : ApiController
    {
        private PeriodistasSMSEntities db = new PeriodistasSMSEntities();

        [HttpGet]
        public IHttpActionResult GetColaProductos()
        {
            var response = db.ColaProducto.Select
                (cp => new ColaProductoDTO()
                {
                    Id = cp.Id,
                    IdProducto = cp.IdProducto,
                    IdCola = cp.IdCola,
                    FechaInicio = cp.FechaInicio,
                    FechaTermino = cp.FechaTermino
                });

            return Ok(response);
        }


        [HttpPost]
        public IHttpActionResult PostColaProducto([FromBody] ColaProductoDTO colaProd)
        {
            if(colaProd.FechaInicio == null || colaProd.FechaTermino == null)
            {
                return Content(HttpStatusCode.BadRequest, "Las fechas no son válidas.");
            }

            ColaProducto cp = new ColaProducto
            {
                IdProducto = colaProd.IdProducto,
                IdCola = colaProd.IdCola,
                FechaInicio = colaProd.FechaInicio.Value,
                FechaTermino = colaProd.FechaTermino.Value
            };

            db.ColaProducto.Add(cp);

            try
            {
                db.SaveChanges();
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.EntityValidationErrors.FirstOrDefault().ValidationErrors.FirstOrDefault().ErrorMessage);
            }
            catch (DbUpdateException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.GetMessage().Replace("\r\n", "<br>"));
            }

            return Content(HttpStatusCode.OK, "Asociación creada correctamente con id = " + cp.Id);
        }

        [HttpPost]
        public IHttpActionResult DeleteColaProductos([FromBody] int[] ids)
        {
            int ok = 0, err = 0;

            foreach (int idColaProd in ids)
            {
                var colaProd = db.ColaProducto.Find(idColaProd);
                if (colaProd == null)
                {
                    err++;
                    continue;
                }

                db.ColaProducto.Remove(colaProd);
                ok++;
            }

            db.SaveChanges();

            if (err == 0) return Content(HttpStatusCode.OK, "Asociaciones borradas correctamente");
            else if (ok == 0) return Content(HttpStatusCode.NotFound, "Error! No se encontraron las asociaciones a borrar. Puede que ya hayan sido borradas por alguien más.");
            else
            {
                string response;
                if (err == 1)
                {
                    if (ok == 1)
                    {
                        response = ok + " asociación borrada correctamente, " + err +
                                  " no se encontró en la base de datos.";
                    }
                    else
                    {
                        response = ok + " asociaciones borradas correctamente, " + err +
                                  " no se encontró en la base de datos.";
                    }
                }
                else
                {
                    if (ok == 1)
                    {
                        response = ok + " asociación borrada correctamente, " + err +
                                  " no se encontraron en la base de datos.";
                    }
                    else
                    {
                        response = ok + " asociaciones borradas correctamente, " + err +
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

        private bool ColaProductoExists(int id)
        {
            return db.ColaProducto.Count(e => e.Id == id) > 0;
        }
    }
}