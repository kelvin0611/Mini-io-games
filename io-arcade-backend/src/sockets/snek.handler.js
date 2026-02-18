export const initSnekSockets = (io) => {
    const snekNamespace = io.of('/snek');

    snekNamespace.on('connection', (socket) => {
        console.log(`Player connected to Snek.io: ${socket.id}`);

        socket.on('playerMove', (data) => {
            // Broadcast player movement to everyone else in the room
            socket.broadcast.emit('enemyMoved', { id: socket.id, ...data });
        });

        socket.on('disconnect', () => {
            console.log(`Player disconnected: ${socket.id}`);
            snekNamespace.emit('enemyDisconnected', socket.id);
        });
    });
};
