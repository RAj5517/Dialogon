import os
import sys
import time
import win32serviceutil
import win32service
import win32event
import servicemanager
import socket
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    filename='service_installer.log',
    filemode='a'
)
logger = logging.getLogger('service_installer')

class MeetingSchedulerService(win32serviceutil.ServiceFramework):
    _svc_name_ = "DialogonMeetingScheduler"
    _svc_display_name_ = "Dialogon Meeting Scheduler Service"
    _svc_description_ = "Automatically joins scheduled meetings for Dialogon users"
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
        socket.setdefaulttimeout(60)
        self.is_running = True
        
    def SvcStop(self):
        """Called when the service is asked to stop"""
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
        self.is_running = False
        logger.info("Service stop requested")
        
    def SvcDoRun(self):
        """Called when the service is starting"""
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        logger.info("Service starting")
        self.main()
        
    def main(self):
        """Main service function"""
        try:
            # Get the directory where this script is located
            script_dir = os.path.dirname(os.path.abspath(__file__))
            
            # Add the script directory to the Python path
            if script_dir not in sys.path:
                sys.path.append(script_dir)
            
            # Import the meeting scheduler module
            from meeting_scheduler import run_scheduler
            
            # Run the scheduler
            logger.info("Starting meeting scheduler from service")
            run_scheduler()
            
        except Exception as e:
            logger.error(f"Error in service main function: {str(e)}")
            servicemanager.LogErrorMsg(f"Error in service main function: {str(e)}")

def install_service():
    """Install the service"""
    try:
        # Check if Python is running with admin privileges
        try:
            is_admin = os.getuid() == 0
        except AttributeError:
            import ctypes
            is_admin = ctypes.windll.shell32.IsUserAnAdmin() != 0
            
        if not is_admin:
            logger.error("Administrator privileges required to install service")
            print("Error: Administrator privileges required to install service")
            print("Please run this script as Administrator")
            return False
            
        # Install the service
        win32serviceutil.HandleCommandLine(MeetingSchedulerService)
        return True
        
    except Exception as e:
        logger.error(f"Error installing service: {str(e)}")
        print(f"Error installing service: {str(e)}")
        return False

def print_usage():
    """Print usage instructions"""
    print("\nDialogon Meeting Scheduler Service Installer")
    print("===========================================")
    print("\nUsage:")
    print("  install   - Install the service")
    print("  update    - Update the service")
    print("  remove    - Remove the service")
    print("  start     - Start the service")
    print("  stop      - Stop the service")
    print("  restart   - Restart the service")
    print("  status    - Check service status")
    print("\nExample: python install_service.py install")

if __name__ == '__main__':
    if len(sys.argv) > 1:
        if sys.argv[1] == 'status':
            try:
                # Check service status
                service_status = win32serviceutil.QueryServiceStatus(MeetingSchedulerService._svc_name_)
                status_map = {
                    win32service.SERVICE_STOPPED: "STOPPED",
                    win32service.SERVICE_START_PENDING: "STARTING",
                    win32service.SERVICE_STOP_PENDING: "STOPPING",
                    win32service.SERVICE_RUNNING: "RUNNING",
                    win32service.SERVICE_CONTINUE_PENDING: "CONTINUING",
                    win32service.SERVICE_PAUSE_PENDING: "PAUSING",
                    win32service.SERVICE_PAUSED: "PAUSED"
                }
                status_str = status_map.get(service_status[1], f"UNKNOWN ({service_status[1]})")
                print(f"Service status: {status_str}")
            except Exception as e:
                print(f"Error checking service status: {str(e)}")
                print("The service may not be installed.")
        else:
            # Handle other commands
            install_service()
    else:
        # No arguments provided, show usage
        print_usage()
        if len(sys.argv) == 1:
            # If run without arguments, prepare for service execution
            servicemanager.Initialize()
            servicemanager.PrepareToHostSingle(MeetingSchedulerService)
            servicemanager.StartServiceCtrlDispatcher() 