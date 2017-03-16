using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ContAdminServ_V3.Models
{
    public class ContenidoSearch
    {
        public int? Id { get; set; }
        public string IdProductos { get; set; }
        public string NombreProducto { get; set; }
        public string FechaFormateada { get; set; }
        public string Texto { get; set; }
        public string Tag { get; set; }
        public bool AllPropertiesNull()
        {
            if (this.Id.HasValue)  return false;
            if (this.IdProductos != null) return false;
            if (this.NombreProducto != null) return false;
            if (this.FechaFormateada != null) return false;
            if (this.Texto != null) return false;
            if (this.Tag != null) return false;

            return true;
        }
    }

    public class ContenidoDTO
    {
        public int Id { get; set; }
        public string Texto { get; set; }
        public Nullable<System.DateTime> FechaEnvio { get; set; }
        public Nullable<bool> Enviado { get; set; }
        public string Tag { get; set; }

        public IEnumerable<ProductoDTO> Producto { get; set; }
        public int[] IdProductos { get; set; }
    }

    public class ContenidoPUT
    {
        // Flags para indicar si el contenido debe ser actualizado o no
        public bool FlagTexto { get; set; }
        public bool FlagFecha { get; set; }
        public bool FlagTag { get; set; }
        public bool FlagProductos { get; set; }

        public ContenidoDTO[] Contenidos { get; set; }
    }

    public class ProductoDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public bool Atemporal { get; set; }
        public CategoriaDTO Categoria { get; set; }
        public int DiasRestantes { get; set; }
        public IEnumerable<ContenidoDTO> Contenido { get; set; }
    }

    public class CategoriaDTO
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
    }


    public class ColaDTO
    {
        public int Id { get; set; }
        public string Texto { get; set; }
        public int Largo { get; set; }
    }


    public class ColaProductoDTO
    {
        public int Id { get; set; }
        public int IdProducto { get; set; }
        public int IdCola { get; set; }
        public DateTime? FechaInicio { get; set; }
        public DateTime? FechaTermino { get; set; }
    }

}
