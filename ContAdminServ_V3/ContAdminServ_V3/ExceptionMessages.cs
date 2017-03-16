using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ContAdminServ_V3
{
    public static class ExceptionMessages
    {
        public static string GetMessage(this Exception ex)
        {
            Exception realerror = ex;

            while (realerror.InnerException != null && !String.IsNullOrWhiteSpace(realerror.InnerException.Message))
            {
                realerror = realerror.InnerException;
            }

            return (realerror.Message.Replace("\r\n", "<br>"));
        }
    }
}