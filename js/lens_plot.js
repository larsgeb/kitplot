var user_title = "My kit!";
var user_fontsize = 20;
var user_fontsize_axes = 12;
var backgroundColor = "#FFFFFF";

var image = new Image();
image.src = "img/logo.png";

Chart.plugins.register({
    beforeDraw: function(c) {
        var ctx = c.chart.ctx;
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, c.chart.width, c.chart.height);
    },
});

Chart.defaults.global.animation.duration = 00;
Chart.defaults.global.animation.easing = "easeInOutQuad";
Chart.defaults.global.tooltips.enabled = "false";

class lens {
    constructor(type, focal_range, aperture_range) {
        this.type = type;
        this.focal_range = focal_range;
        this.aperture_range = aperture_range;

        // Generate once and store as attribute.
        this.hash_code = this.hashCode();
    }

    toString() {
        return `Lens: ${this.type}, ${this.focal_range}, ${this.aperture_range}`;
    }

    toData() {
        if (this.type == "Prime") {
            return [
                [this.focal_range, this.aperture_range]
            ];
        } else {
            if (Array.isArray(this.aperture_range)) {
                return [
                    [this.focal_range[0], this.aperture_range[0]],
                    [this.focal_range[1], this.aperture_range[1]],
                ];
            } else {
                return [
                    [this.focal_range[0], this.aperture_range],
                    [this.focal_range[1], this.aperture_range],
                ];
            }
        }
    }

    print() {
        console.log(
            `Lens: ${this.type}, ${this.focal_range}, ${this.aperture_range}`
        );
    }

    toRow() {
        if (this.type == "Prime") {
            return (
                `<tr>` +
                `<td>${this.type}</td>` +
                `<td>${this.focal_range}</td>` +
                `<td>${this.aperture_range}</td>` +
                `<td><a class="remove-lens" id="${this.hash_code}" onclick="removeLens(this)">remove</a></td>` +
                `</tr>`
            );
        } else {
            var focal_range = `${this.focal_range[0]} - ${this.focal_range[1]}`;

            if (Array.isArray(this.aperture_range)) {
                var aperture = `${this.aperture_range[0]} - ${this.aperture_range[1]}`;
            } else {
                var aperture = this.aperture_range;
            }

            return (
                `<tr>` +
                `<td>${this.type}</td>` +
                `<td>${focal_range}</td>` +
                `<td>${aperture}</td>` +
                `<td><a class="remove-lens" id="${this.hash_code}" onclick="removeLens(this)">remove</a></td>` +
                `</tr>`
            );
        }
    }

    hashCode() {
        return this.toString()
            .split("")
            .reduce(function(a, b) {
                a = (a << 5) - a + b.charCodeAt(0);
                return a & a;
            }, 0);
    }
}

lenses = [
    new lens("Zoom", [14, 30], 4),
    new lens("Prime", 20, 1.8),
    new lens("Prime", 50, 1.8),
    new lens("Zoom", [24, 70], [2.8, 4]),
    new lens("Zoom", [70, 300], [4.5, 5.6]),
    new lens("Prime", 800, 5.6),
];

function updateList() {
    var lenstable = document.getElementById("lenstable-body");

    lenstable.innerHTML = "";

    lenses.forEach(function(arrayItem) {
        lenstable.innerHTML += arrayItem.toRow();
    });
}

function addPrime() {
    var focal = $("#prime-focal").val();
    var aperture = $("#prime-aperture").val();

    $("#prime-focal").val("");
    $("#prime-aperture").val("");

    if (isNaN(focal) || isNaN(aperture)) {
        return;
    }

    var lens_to_add = new lens("Prime", focal, aperture);

    if (typeof checkAlreadyExists(lens_to_add.hash_code) == "undefined") {
        lenses.push(lens_to_add);
        updateList();
        refreshPlot();
    }
}

function addVarZoom() {
    var focal_min = $("#var-zoom-focal-min").val();
    var focal_max = $("#var-zoom-focal-max").val();
    var aperture_min = $("#var-zoom-aperture-min").val();
    var aperture_max = $("#var-zoom-aperture-max").val();

    $("#var-zoom-focal-min").val("");
    $("#var-zoom-focal-max").val("");
    $("#var-zoom-aperture-min").val("");
    $("#var-zoom-aperture-max").val("");

    if (
        isNaN(focal_min) ||
        isNaN(focal_max) ||
        isNaN(aperture_min) ||
        isNaN(aperture_max)
    ) {
        return;
    }

    var lens_to_add = new lens(
        "Zoom", [focal_min, focal_max], [aperture_min, aperture_max]
    );

    if (typeof checkAlreadyExists(lens_to_add.hash_code) == "undefined") {
        lenses.push(lens_to_add);
        updateList();
        refreshPlot();
    }
}

function addFixZoom() {
    var focal_min = $("#fix-zoom-focal-min").val();
    var focal_max = $("#fix-zoom-focal-max").val();
    var aperture = $("#fix-zoom-aperture").val();

    $("#fix-zoom-focal-min").val("");
    $("#fix-zoom-focal-max").val("");
    $("#fix-zoom-aperture").val("");

    if (isNaN(focal_min) || isNaN(focal_max) || isNaN(aperture)) {
        return;
    }

    var lens_to_add = new lens("Zoom", [focal_min, focal_max], aperture);

    if (typeof checkAlreadyExists(lens_to_add.hash_code) == "undefined") {
        lenses.push(lens_to_add);
        updateList();
        refreshPlot();
    }
}

function checkAlreadyExists(hash_to_check) {
    var hashes = lenses.map((lens) => lens.hash_code);
    index_of_lens_to_remove = hashes.find((hash) => hash == hash_to_check);
    return index_of_lens_to_remove;
}

class plot_object {
    constructor(data_passed) {
        this.data = data_passed.map((o) => ({ x: o[0], y: o[1] }));
        this.label = null;
        this.showLine = true;
        this.fill = false;

        if (this.data.length == 1) {
            this.pointStyle = "circle";
            this.backgroundColor = "red";
            this.borderColor = "red";
            this.radius = 4;
        } else {
            this.pointStyle = "circle";
            this.backgroundColor = "black";
            this.borderColor = "black";
        }
    }
}

function refreshPlot() {
    var plot_objects = lenses.map((lens) => new plot_object(lens.toData()));

    return new Chart("line-chart", {
        type: "scatter",
        responsive: true,
        data: {
            datasets: plot_objects,
        },
        options: {
            watermark: {
                image: image,
                alignX: "middle",
                alignY: "middle",
                opacity: 0.07,
                alignToChartArea: true,
                // position: "back",
                width: 400,
                height: 50,
            },
            title: { display: true, text: user_title, fontSize: user_fontsize },
            animation: {
                onComplete: function() {
                    var a = document.getElementById("download-button");
                    a.href = this.toBase64Image();
                    a.download = "plot_of_your_kit.png";
                },
            },
            tooltips: { enabled: false },
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                        stepSize: 0.1,
                        fontSize: user_fontsize_axes,
                        callback: function(value, index, values) {
                            if (
                                [1, 1.4, 2, 2.8, 4, 5.6, 8, 11, 16, 22, 28].includes(value)
                            ) {
                                return `f/${value}`;
                            } else {
                                return undefined;
                            }
                        },
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "aperture",
                        fontSize: user_fontsize_axes,
                    },
                }, ],
                xAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: "focal length",
                        fontSize: user_fontsize_axes,
                    },
                    type: "logarithmic",
                    ticks: {
                        fontSize: user_fontsize_axes,
                        stepSize: 1,
                        callback: function(value, index, values) {
                            if (
                                [
                                    8,
                                    10,
                                    20,
                                    30,
                                    50,
                                    85,
                                    100,
                                    135,
                                    200,
                                    300,
                                    500,
                                    800,
                                    1000,
                                    1500,
                                    2000,
                                ].includes(value)
                            ) {
                                return `${value}mm`;
                            } else {
                                return undefined;
                            }
                        },
                    },
                }, ],
            },
            legend: { display: false },
        },
    });
}

updateList();
refreshPlot();

var refresh_button = document.getElementById("refresh-button");

Chart.defaults.global.animation.duration = 0;

function removeLens(passedObject) {
    var hash_to_remove = passedObject.id;

    var hashes = lenses.map((lens) => lens.hash_code);

    index_of_lens_to_remove = hashes.findIndex((hash) => hash == hash_to_remove);

    lenses.splice(index_of_lens_to_remove, 1);

    updateList();
    refreshPlot();
}

$(".plot-input").on("input", function(e) {
    user_fontsize_axes = $("#input-axes-font-size").val();
    user_fontsize = $("#input-title-font-size").val();
    user_title = $("#input-title").val();

    updateList();
    refreshPlot();
});