﻿//------------------------------------------------------------------------------
// <auto-generated>
//     Este código se generó a partir de una plantilla.
//
//     Los cambios manuales en este archivo pueden causar un comportamiento inesperado de la aplicación.
//     Los cambios manuales en este archivo se sobrescribirán si se regenera el código.
// </auto-generated>
//------------------------------------------------------------------------------

namespace ContAdminServ_V3
{
    using System;
    using System.Data.Entity;
    using System.Data.Entity.Infrastructure;
    using System.Data.Entity.Core.Objects;
    using System.Linq;
    
    public partial class PeriodistasSMSEntities : DbContext
    {
        public PeriodistasSMSEntities()
            : base("name=PeriodistasSMSEntities")
        {
            this.Configuration.ProxyCreationEnabled = false;
            this.Configuration.LazyLoadingEnabled = false;
        }

        protected override void OnModelCreating(DbModelBuilder modelBuilder)
        {
            throw new UnintentionalCodeFirstException();
        }
    
        public virtual DbSet<Categoria> Categoria { get; set; }
        public virtual DbSet<Contenido> Contenido { get; set; }
        public virtual DbSet<Producto> Producto { get; set; }
        public virtual DbSet<Cola> Cola { get; set; }
        public virtual DbSet<ColaProducto> ColaProducto { get; set; }
    
        public virtual ObjectResult<GetContent_Result> GetContent()
        {
            return ((IObjectContextAdapter)this).ObjectContext.ExecuteFunction<GetContent_Result>("GetContent");
        }
    }
}
