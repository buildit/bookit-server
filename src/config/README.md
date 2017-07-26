# Config

This directory has environment variables and the runtime for the application

##Environment

We want to try to keep the bootstrap environment as simple as possible.  Currently, we have settings that determine
if we are connecting to an Azure back end or a "mock" one.  If we are connecting to an Azure back end then we need
to provide the identity the application is operating under

##Runtime

The runtime is a set of settings (in practice, the services) that attempts to localize access in one place.  Please look
at the `services` directory for a horizontal view of all the services that exist internally.

