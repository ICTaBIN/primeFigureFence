document.addEventListener("DOMContentLoaded", function () {
    const table = document.getElementById("materialsTable");
    const headerCells = table.querySelectorAll("th");

    headerCells.forEach((headerCell, index) => {
        const resizer = document.createElement("div");
        resizer.classList.add("resizer");

        // Append the resizer to the header cell
        headerCell.appendChild(resizer);

        let startX, startWidth;

        resizer.addEventListener("mousedown", function (e) {
            startX = e.pageX;
            startWidth = headerCell.offsetWidth;
            document.addEventListener("mousemove", resizeColumn);
            document.addEventListener("mouseup", stopResize);
        });

        function resizeColumn(e) {
            const newWidth = startWidth + (e.pageX - startX);
            headerCell.style.width = `${newWidth}px`;
            table.style.tableLayout = "fixed"; // Ensures the table layout doesn't shift
        }

        function stopResize() {
            document.removeEventListener("mousemove", resizeColumn);
            document.removeEventListener("mouseup", stopResize);
        }
    });
});
