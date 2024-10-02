import { Component, OnInit, ViewChild, ElementRef, CUSTOM_ELEMENTS_SCHEMA, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VeltService } from '../../services/velt.service';

// Import necessary components from Chart.js
import {
	Chart,
	BarController,
	BarElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
	Legend
} from 'chart.js';

// Register the components with Chart.js
Chart.register(
	BarController,
	BarElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
	Legend
);

/**
 * DocumentComponent is responsible for rendering a chart and managing comments.
 * It uses Chart.js for visualization and Velt for comment functionality.
 */
@Component({
	selector: 'app-document',
	standalone: true,
	imports: [RouterOutlet],
	templateUrl: './document.component.html',
	styleUrl: './document.component.scss',
	schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DocumentComponent implements OnInit {
	title = 'charts_chartjs';
	@ViewChild('acquisitions', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
	@ViewChild('veltCommentsRef', { static: true }) veltCommentsRef!: ElementRef<HTMLDivElement>;

	/** Context for comment configuration */
	context = { canvasCommentConfig: { data: { seriesId: '', xValue: '', yValue: '', chartId: '' }, position: { x: 0, y: 0 } } }

	/** Velt client signal */
	client = this.veltService.clientSignal();

	constructor(private veltService: VeltService) {
		// Set up Velt client and document when initialized
		effect(() => {
			this.client = this.veltService.clientSignal();
			if (this.client) {
				// Contain your comments in a document by setting a Document ID & Name
				this.client.setDocument('charts_chartjs', { documentName: 'charts_chartjs' });

				// Set Dark Mode
				this.client.setDarkMode(true)

				const commentElement = this.client?.getCommentElement()
				commentElement?.getAllCommentAnnotations().subscribe((commentAnnotations: any) => {
					this.renderCommentAnnotations(commentAnnotations)
				});
			}
		});
	}

	/**
	 * Initializes the component, sets up the chart, and adds event listeners.
	 */
	async ngOnInit(): Promise<void> {
		const data = [
			{ year: 2010, count: 10 },
			{ year: 2011, count: 20 },
			{ year: 2012, count: 15 },
			{ year: 2013, count: 25 },
			{ year: 2014, count: 22 },
			{ year: 2015, count: 30 },
			{ year: 2016, count: 28 },
		];

		this.veltCommentsRef.nativeElement.addEventListener('onCommentAdd', (event: any) => {
			event.detail?.addContext({ ...this.context, commentType: 'manual' });
		});

		new Chart(
			this.canvasRef.nativeElement,
			{
				type: 'bar',
				data: {
					labels: data.map(row => row.year),
					datasets: [
						{
							label: 'Acquisitions by year',
							data: data.map(row => row.count),
							backgroundColor: 'rgba(98, 93, 245, 0.6)',
							borderColor: 'rgba(98, 93, 245, 1)',
							borderWidth: 1
						}
					]
				},
				options: {
					responsive: true,
				}
			}
		);
	}

	/**
	 * Renders comment annotations on the chart.
	 * @param commentAnnotations - The annotations to render.
	 */
	renderCommentAnnotations(commentAnnotations: any) {
		try {
			const commentsContainer = document.querySelector('.html-canvas');
			if (commentAnnotations) {
				commentAnnotations.forEach((commentAnnotation: any) => {
					if (!document.getElementById(`comment-pin-container-${commentAnnotation.annotationId}`) && commentAnnotation.context) {
						const { x, y } = commentAnnotation.context.canvasCommentConfig.position;
						var commentPinContainer = document.createElement('div');
						commentPinContainer.className = 'comment-pin-container';
						commentPinContainer.id = `comment-pin-container-${commentAnnotation.annotationId}`;
						commentPinContainer.style.left = x - 12 + 'px';
						commentPinContainer.style.top = y + 'px';
						commentPinContainer.innerHTML = `<velt-comment-pin annotation-id="${commentAnnotation?.annotationId}"></velt-comment-pin>`;
						commentsContainer?.appendChild(commentPinContainer);
					}
				});
			}
		} catch (error) {
			console.error('Error rendering comment annotations:', error);
		}
	}

	/**
	 * Handles click events on the chart, updating the context for comments.
	 * @param event - The mouse event from the click.
	 */
	handleChartClick(event: MouseEvent) {
		const chart = Chart.getChart(this.canvasRef.nativeElement);
		if (chart) {
			// Get the nearest element to the click event

			const elements = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);

			if (elements.length > 0) {
				const element = elements[0];
				const datasetIndex = element.datasetIndex;
				const index = element.index;
				const dataset = chart.data.datasets?.[datasetIndex];
				const xValue = chart.data.labels?.[index];
				const yValue = dataset?.data?.[index];

				this.context = {
					canvasCommentConfig: {
						data: {
							seriesId: dataset?.label ?? '',
							xValue: xValue?.toString() ?? '',
							yValue: yValue?.toString() ?? '',
							chartId: chart.id ?? ''
						},
						position: { x: element.element.x, y: element.element.y }
					}
				};
			}
		}
	}

	/**
	 * Adds a manual comment with the given context.
	 * @param context - The context for the manual comment.
	 */
	addManualComment(context: any) {
		// Implement your logic to add a manual comment
		console.log('Adding manual comment with context:', context);
	}
}
