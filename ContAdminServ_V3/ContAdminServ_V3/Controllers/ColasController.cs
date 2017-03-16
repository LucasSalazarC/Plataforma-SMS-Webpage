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
    public class ColasController : ApiController
    {
        private PeriodistasSMSEntities db = new PeriodistasSMSEntities();
    
        [HttpGet]
        public IHttpActionResult GetColas()
        {
            var response = db.Cola.Select
                (c => new ColaDTO()
                {
                    Id = c.Id,
                    Texto = c.Texto,
                    Largo = c.Texto.Length
                });

            return Ok(response);
        }


        [HttpPut]
        public IHttpActionResult PutColas(ICollection<Cola> colas)
        {
            foreach (Cola cola in colas)
            {
                db.Entry(cola).State = EntityState.Modified;
            }

            try
            {
                db.SaveChanges();
            }
            catch (System.Data.Entity.Validation.DbEntityValidationException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.EntityValidationErrors.FirstOrDefault().ValidationErrors.FirstOrDefault().ErrorMessage);
            }
            catch (DbUpdateConcurrencyException)
            {
                return Content(HttpStatusCode.InternalServerError, "Error de concurrencia al actualizar los contenidos");
            }
            catch (DbUpdateException ex)
            {
                return Content(HttpStatusCode.BadRequest, ex.InnerException.InnerException.Message);
            }

            return Content(HttpStatusCode.OK, "Contenidos editados correctamente");
        }


        [HttpPost]
        public IHttpActionResult PostCola([FromBody] Cola cola)
        {
            db.Cola.Add(cola);

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
                return Content(HttpStatusCode.BadRequest, ex.InnerException.InnerException.Message);
            }

            return Content(HttpStatusCode.OK, "Cola creada correctamente con id = " + cola.Id);
        }

        
        [HttpPost]
        public IHttpActionResult DeleteColas(ICollection<int> ids)
        {
            int ok = 0, err = 0;

            foreach (int idCola in ids)
            {
                var cola = db.Cola.Find(idCola);
                if(cola == null)
                {
                    err++;
                    continue;
                }

                db.Cola.Remove(cola);
                ok++;
            }

            db.SaveChanges();

            if (err == 0) return Content(HttpStatusCode.OK, "Contenidos borrados correctamente");
            else if (ok == 0) return Content(HttpStatusCode.NotFound, "Error! No se encontraron los contenidos a borrar. Puede que ya hayan sido borrados por alguien más.");
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

        private bool ColaExists(int id)
        {
            return db.Cola.Count(e => e.Id == id) > 0;
        }
    }
}